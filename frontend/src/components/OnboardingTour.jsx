import React, { useEffect, useMemo, useState } from 'react';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getHighlightRadius = (el) => {
    try {
        const styles = window.getComputedStyle(el);
        // border-radius can be "12px" or "12px 8px ..." - keep it simple: first token
        return (styles.borderRadius || '12px').split(' ')[0];
    } catch {
        return '12px';
    }
};

export const OnboardingTour = ({
    open,
    steps,
    stepIndex,
    onNext,
    onPrev,
    onClose,
    activeTab,
}) => {
    const step = useMemo(() => (steps ? steps[stepIndex] : null), [steps, stepIndex]);
    const [highlight, setHighlight] = useState(null); // { rect, radius }

    useEffect(() => {
        if (!open || !step) {
            setHighlight(null);
            return;
        }

        const recompute = () => {
            if (!step?.targetSelector) {
                setHighlight(null);
                return;
            }
            const target = document.querySelector(step.targetSelector);
            if (!target) {
                setHighlight(null);
                return;
            }
            const rect = target.getBoundingClientRect();
            // Guard: element might exist but be off-screen
            if (!rect || rect.width <= 0 || rect.height <= 0) {
                setHighlight(null);
                return;
            }
            setHighlight({ rect, radius: getHighlightRadius(target) });
        };

        recompute();

        window.addEventListener('resize', recompute);
        // capture = also fires during inner scroll containers
        window.addEventListener('scroll', recompute, true);
        return () => {
            window.removeEventListener('resize', recompute);
            window.removeEventListener('scroll', recompute, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, stepIndex, step?.targetSelector, activeTab]);

    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
                return;
            }
            if (e.key === 'ArrowLeft') {
                onPrev?.();
                return;
            }
            if (e.key === 'ArrowRight') {
                onNext?.();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose, onPrev, onNext]);

    const tooltipPosition = useMemo(() => {
        if (!highlight?.rect) {
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
        const { rect } = highlight;
        const centerX = rect.left + rect.width / 2;
        const half = 170; // matches w-[340px] below
        const left = clamp(centerX, half + 12, window.innerWidth - half - 12);

        const placeAbove = rect.top > 220;
        if (placeAbove) {
            return { top: rect.top - 10, left, transform: 'translate(-50%, -100%)' };
        }
        return { top: rect.bottom + 10, left, transform: 'translate(-50%, 0)' };
    }, [highlight]);

    const isFirst = stepIndex <= 0;
    const isLast = steps ? stepIndex >= steps.length - 1 : true;

    if (!open || !step) return null;

    return (
        <div aria-hidden className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/40" />

            {highlight?.rect && (
                <div
                    className="pointer-events-none absolute"
                    style={{
                        top: highlight.rect.top - 6,
                        left: highlight.rect.left - 6,
                        width: highlight.rect.width + 12,
                        height: highlight.rect.height + 12,
                        border: '2px solid rgba(99,102,241,0.95)',
                        boxShadow: '0 0 0 6px rgba(99,102,241,0.18)',
                        borderRadius: highlight.radius || '12px',
                    }}
                />
            )}

            <div
                role="dialog"
                aria-modal="true"
                className="absolute z-[101] w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-gray-200 shadow-2xl"
                style={tooltipPosition}
            >
                <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                                Шаг {stepIndex + 1}/{steps.length}
                            </div>
                            <div className="mt-1 text-sm font-bold text-gray-900">{step.title}</div>
                        </div>
                        <button
                            className="text-gray-400 hover:text-gray-600 transition"
                            onClick={onClose}
                            type="button"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {step.description && (
                        <div className="mt-2 text-sm text-gray-700 leading-relaxed">{step.description}</div>
                    )}

                    {step.hint && (
                        <div className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2">
                            {step.hint}
                        </div>
                    )}

                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            disabled={isFirst}
                            onClick={onPrev}
                            className={`flex-1 text-sm font-semibold py-2 px-3 rounded-lg transition border ${
                                isFirst
                                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            Назад
                        </button>
                        <button
                            type="button"
                            onClick={isLast ? onClose : onNext}
                            className="flex-1 text-sm font-semibold py-2 px-3 rounded-lg transition bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            {isLast ? 'Завершить' : 'Далее'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


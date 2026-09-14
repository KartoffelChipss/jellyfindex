import { useId, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { AI_USAGE_OPTIONS, type AiUsage } from '@jellyfindex/schema';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from '@/components/ui/popover';

export interface ListFiltersState {
    hideAbandoned: boolean;
    hideBeta: boolean;
    openSourceOnly: boolean;
    aiUsage: Record<AiUsage, boolean>;
}

export const DEFAULT_LIST_FILTERS: ListFiltersState = {
    hideAbandoned: true,
    hideBeta: false,
    openSourceOnly: false,
    aiUsage: { unknown: true, none: true, 'ai-assisted': true, 'vibe-coded': true },
};

export const LIST_FILTERS_EVENT = 'jf:filters-change';

const AI_USAGE_LABELS: Record<AiUsage, string> = {
    unknown: 'Unknown',
    none: 'No AI',
    'ai-assisted': 'AI-assisted',
    'vibe-coded': 'Vibe-coded',
};

export function ListFilters() {
    const [filters, setFilters] = useState<ListFiltersState>(DEFAULT_LIST_FILTERS);
    const abandonedId = useId();
    const betaId = useId();
    const openSourceId = useId();
    const aiUsageIdPrefix = useId();

    function update(patch: Partial<ListFiltersState>) {
        const next = { ...filters, ...patch };
        setFilters(next);
        window.dispatchEvent(
            new CustomEvent<ListFiltersState>(LIST_FILTERS_EVENT, { detail: next })
        );
    }

    function toggleAiUsage(value: AiUsage, checked: boolean) {
        update({ aiUsage: { ...filters.aiUsage, [value]: checked } });
    }

    const aiUsageActive = Object.values(filters.aiUsage).some((shown) => !shown);
    const activeCount = [
        !filters.hideAbandoned,
        filters.hideBeta,
        filters.openSourceOnly,
        aiUsageActive,
    ].filter(Boolean).length;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    <SlidersHorizontal />
                    Filters
                    {activeCount > 0 && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[0.65rem] font-medium text-primary-foreground">
                            {activeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
                <PopoverHeader>
                    <PopoverTitle>Filters</PopoverTitle>
                </PopoverHeader>
                <div className="flex flex-col gap-2.5">
                    <label
                        htmlFor={abandonedId}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                        <Checkbox
                            id={abandonedId}
                            checked={filters.hideAbandoned}
                            onCheckedChange={(checked) =>
                                update({ hideAbandoned: checked === true })
                            }
                        />
                        Hide abandoned
                    </label>
                    <label
                        htmlFor={betaId}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                        <Checkbox
                            id={betaId}
                            checked={filters.hideBeta}
                            onCheckedChange={(checked) => update({ hideBeta: checked === true })}
                        />
                        Hide beta
                    </label>
                    <label
                        htmlFor={openSourceId}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                        <Checkbox
                            id={openSourceId}
                            checked={filters.openSourceOnly}
                            onCheckedChange={(checked) =>
                                update({ openSourceOnly: checked === true })
                            }
                        />
                        Open source only
                    </label>
                </div>

                <div className="mt-3 border-t pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">AI usage</p>
                    <div className="flex flex-col gap-2.5">
                        {AI_USAGE_OPTIONS.map((value) => {
                            const id = `${aiUsageIdPrefix}-${value}`;
                            return (
                                <label
                                    key={value}
                                    htmlFor={id}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        id={id}
                                        checked={filters.aiUsage[value]}
                                        onCheckedChange={(checked) =>
                                            toggleAiUsage(value, checked === true)
                                        }
                                    />
                                    {AI_USAGE_LABELS[value]}
                                </label>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

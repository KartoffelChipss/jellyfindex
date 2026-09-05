import { useId, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
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
}

export const DEFAULT_LIST_FILTERS: ListFiltersState = {
    hideAbandoned: true,
    hideBeta: false,
    openSourceOnly: false,
};

export const LIST_FILTERS_EVENT = 'jf:filters-change';

export function ListFilters() {
    const [filters, setFilters] = useState<ListFiltersState>(DEFAULT_LIST_FILTERS);
    const abandonedId = useId();
    const betaId = useId();
    const openSourceId = useId();

    function update(patch: Partial<ListFiltersState>) {
        const next = { ...filters, ...patch };
        setFilters(next);
        window.dispatchEvent(
            new CustomEvent<ListFiltersState>(LIST_FILTERS_EVENT, { detail: next })
        );
    }

    const activeCount = [!filters.hideAbandoned, filters.hideBeta, filters.openSourceOnly].filter(
        Boolean
    ).length;

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
            </PopoverContent>
        </Popover>
    );
}

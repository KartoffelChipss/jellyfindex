import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InstallTabsProps {
    platforms: {
        value: string;
        label: string;
        html: string;
    }[];
}

export function InstallTabs({ platforms }: InstallTabsProps) {
    if (platforms.length === 0) return null;

    return (
        <Tabs defaultValue={platforms[0].value}>
            <TabsList>
                {platforms.map((platform) => (
                    <TabsTrigger key={platform.value} value={platform.value}>
                        {platform.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {platforms.map((platform) => (
                <TabsContent key={platform.value} value={platform.value}>
                    <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: platform.html }}
                    />
                </TabsContent>
            ))}
        </Tabs>
    );
}

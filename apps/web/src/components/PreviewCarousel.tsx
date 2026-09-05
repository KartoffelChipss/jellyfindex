import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';

interface PreviewCarouselProps {
    images: {
        src: string;
        width: number;
        height: number;
        title?: string;
    }[];
}

export function PreviewCarousel({ images }: PreviewCarouselProps) {
    if (images.length === 0) return null;

    return (
        <Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent>
                {images.map((image, index) => (
                    <CarouselItem key={index} className="basis-auto">
                        <figure>
                            <img
                                src={image.src}
                                width={image.width}
                                height={image.height}
                                alt={image.title ?? `Preview ${index + 1}`}
                                className="h-40 w-auto max-w-[85vw] rounded-lg object-cover sm:h-64 sm:max-w-none lg:h-128"
                            />
                            {image.title && (
                                <figcaption className="mt-1.5 text-center text-xs text-muted-foreground">
                                    {image.title}
                                </figcaption>
                            )}
                        </figure>
                    </CarouselItem>
                ))}
            </CarouselContent>
            {images.length > 1 && (
                <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                </>
            )}
        </Carousel>
    );
}

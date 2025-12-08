import Image from "next/image";
import {
    ContainerRect,
    isImageFitCover,
    isImageSlide,
    Slide,
    SlideImage,
    useLightboxProps,
} from "yet-another-react-lightbox";

type NextSlide = SlideImage & { blurDataURL?: string };

function isNextJsImage(slide: Slide): slide is NextSlide {
    return isImageSlide(slide);
}

export default function NextJsImage({ slide, rect }: { slide: Slide; rect: ContainerRect }) {
    const { imageFit } = useLightboxProps().carousel;

    if (!isNextJsImage(slide)) return undefined;

    const cover = isImageFitCover(slide, imageFit);
    const slideWidth = slide.width;
    const slideHeight = slide.height;

    const width =
        !cover && slideWidth && slideHeight
            ? Math.round(Math.min(rect.width, (rect.height / slideHeight) * slideWidth))
            : rect.width;

    const height =
        !cover && slideWidth && slideHeight
            ? Math.round(Math.min(rect.height, (rect.width / slideWidth) * slideHeight))
            : rect.height;

    const sizes = typeof window !== "undefined" ? `${Math.ceil((width / window.innerWidth) * 100)}vw` : "100vw";

    return (
        <div style={{ position: "relative", width, height }}>
            <Image
                fill
                alt=""
                src={slide.src}
                loading="eager"
                draggable={false}
                placeholder={slide.blurDataURL ? "blur" : undefined}
                style={{ objectFit: cover ? "cover" : "contain", cursor: "grab" }}
                sizes={sizes}
            />
        </div>
    );
}

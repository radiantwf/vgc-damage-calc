import React, { useCallback, useEffect, useRef } from "react";

interface SmartImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  hideMode?: "visibility" | "display";
}

const SmartImage: React.FC<SmartImageProps> = ({
  hideMode = "visibility",
  alt = "",
  onLoad,
  onError,
  src,
  ...props
}) => {
  const imageRef = useRef<HTMLImageElement | null>(null);

  const resetImageVisibility = useCallback((img: HTMLImageElement | null) => {
    if (!img) {
      return;
    }
    img.style.removeProperty("display");
    img.style.removeProperty("visibility");
    img.style.removeProperty("opacity");
  }, []);

  const hideImage = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) {
        return;
      }
      if (hideMode === "display") {
        img.style.display = "none";
        return;
      }
      img.style.visibility = "hidden";
    },
    [hideMode]
  );

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      resetImageVisibility(event.currentTarget);
      onLoad?.(event);
    },
    [onLoad, resetImageVisibility]
  );

  const handleError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      hideImage(event.currentTarget);
      onError?.(event);
    },
    [hideImage, onError]
  );

  useEffect(() => {
    const img = imageRef.current;
    resetImageVisibility(img);
    if (!img) {
      return;
    }

    if (img.complete) {
      if (img.naturalWidth > 0) {
        resetImageVisibility(img);
      } else {
        hideImage(img);
      }
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const currentImg = imageRef.current;
      if (!currentImg || !currentImg.complete) {
        return;
      }
      if (currentImg.naturalWidth > 0) {
        resetImageVisibility(currentImg);
      } else {
        hideImage(currentImg);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [hideImage, resetImageVisibility, src]);

  return (
    <img
      {...props}
      ref={imageRef}
      src={src}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default SmartImage;

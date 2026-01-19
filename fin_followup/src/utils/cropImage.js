export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
        image.src = url
    })

export function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation)

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
}

/**
 * This function was adapted from the one in the Readme of https://github.com/DominicTobias/react-image-crop
 */
export default async function getCroppedImg(
    imageSrc,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    const rotRad = getRadianAngle(rotation)

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    )

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-image.width / 2, -image.height / 2)

    // draw image
    ctx.drawImage(image, 0, 0)

    // croppedAreaPixels values are bounding box relative
    // extract the cropped image using these values
    // 1. Get the cropped image data
    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    )

    // 2. Set canvas size to the final desired crop size
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // 3. Paste generated rotate image at the top left corner of the crop canvas
    ctx.putImageData(data, 0, 0)

    // 4. Client-side Compression & Resizing
    return new Promise((resolve) => {
        const maxWidth = 1000;
        const quality = 0.8;

        let finalCanvas = canvas;
        let { width, height } = canvas;

        // Resize if larger than maxWidth
        if (width > maxWidth) {
            const scale = maxWidth / width;
            const newWidth = maxWidth;
            const newHeight = height * scale;

            finalCanvas = document.createElement('canvas');
            finalCanvas.width = newWidth;
            finalCanvas.height = newHeight;

            const finalCtx = finalCanvas.getContext('2d');
            finalCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
        }

        // Export as compressed JPEG
        finalCanvas.toBlob((blob) => {
            console.log(`Original: ${imageSrc.length} bytes, Compressed: ${blob.size} bytes`);
            resolve(blob);
        }, 'image/jpeg', quality);
    })
}

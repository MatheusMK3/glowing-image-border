App = ($ => {
    // Layout stuff
    const $app = $('#app')
    const $main = $('main').first()
    const $header = $('header').first()
    const $footer = $('footer').first()
    const $sections = $main.children('.container').children('section')

    // Image sizes
    let imageSize = 512

    // Current screen
    let currentStep = 0
    let currentStepScreen = null

    // Selects screen by id
    this.goto = screen_id => {
        // Must be inside $sections
        if (screen_id < 0 || screen_id >= $sections.length)
            return

        // Removes 'active' from current screen
        if (currentStepScreen) {
            currentStepScreen.removeClass('active')
        }

        // Updates current screen
        currentStepScreen = $($sections[screen_id])

        // Adds 'active' to new screen
        currentStepScreen = currentStepScreen.addClass('active')
    }

    // Moves to next screen
    this.next = () => {
        // Don't go past last screen
        if (currentStep + 1 >= $sections.length)
            return

        // Goes to next step
        currentStep++

        // Updates UI
        this.goto(currentStep)
    }

    // Moves to previous screen
    this.prev = () => {
        // Don't go past first screen
        if (currentStep <= 0)
            return

        // Goes to previous step
        currentStep--

        // Updates UI
        this.goto(currentStep)
    }

    // Initialize
    this.goto(currentStep)

    // Updates preview
    let currentEditPreview = document.createElement('canvas')
        currentEditPreview.width = imageSize
        currentEditPreview.height = imageSize
    let currentEditPreviewCtx = currentEditPreview.getContext('2d')
    this.updatePreview = (image) => {
        currentEditPreviewCtx.drawImage(image, 0, 0, currentEditPreview.width, currentEditPreview.height)
    }

    // Applies the image
    let currentHue = 0
    let currentSat = 91
    let currentVal = 97
    let currentEdit = document.createElement('canvas')
        currentEdit.width = imageSize
        currentEdit.height = imageSize
    let currentEditCtx = currentEdit.getContext('2d')
    this.applyImageBorder = (image) => {
        let resourceImages = {
            black: new Image (),
            mask: new Image (),
            glow: new Image (),
        }

        // Loads images
        resourceImages.black.onload = e => { resourceImages.mask.src = '/res/circle-mask.png' }
        resourceImages.mask.onload = e => { resourceImages.glow.src = '/res/circle-mask-glow.png' }
        resourceImages.glow.onload = e => {
            // A little confusing, but here we have the 3 images loaded to work with
            console.log(image)

            // Clears canvas
            currentEditCtx.clearRect(0, 0, currentEdit.width, currentEdit.height)

            // Draws the image
            currentEditCtx.drawImage(image, 0, 0, currentEdit.width, currentEdit.height)

            // Draws black overlay
            currentEditCtx.drawImage(resourceImages.black, 0, 0, currentEdit.width, currentEdit.height)

            // Creates a new canvas for the tint layer
            let tintLayer = document.createElement('canvas')
                tintLayer.width = currentEdit.width
                tintLayer.height = currentEdit.height
            let tintLayerCtx = tintLayer.getContext('2d')

            // Draws the "base" color to it
            tintLayerCtx.fillStyle = `hsl(${currentHue}, ${currentSat}%, ${currentVal / 2}%)`
            tintLayerCtx.fillRect(0, 0, tintLayer.width, tintLayer.height)

            // Sets the blend mode to multiply
            tintLayerCtx.globalCompositeOperation = 'multiply'
            
            // Draws the "raw" mask to it
            tintLayerCtx.drawImage(resourceImages.mask, 0, 0, tintLayer.width, tintLayer.height)
            
            // Sets the blend mode to destination-in
            tintLayerCtx.globalCompositeOperation = 'destination-in'

            // Draws the "raw" mask again, this time masking the image to the underlying layers
            tintLayerCtx.drawImage(resourceImages.mask, 0, 0, tintLayer.width, tintLayer.height)

            // Draw the tint layer to the image
            currentEditCtx.drawImage(tintLayer, 0, 0, currentEdit.width, currentEdit.height)

            // Set blend mode to "lighter" (add)
            currentEditCtx.globalCompositeOperation = 'lighter';

            // Draw the glow layer
            currentEditCtx.drawImage(resourceImages.glow, 0, 0, currentEdit.width, currentEdit.height)

            // Resets blend mode
            currentEditCtx.globalCompositeOperation = 'source-over';

            // Updates the preview
            this.updatePreview(currentEdit)
        }

        resourceImages.black.src = '/res/circle-black.png'
    }

    // Creates a image variable, croppie, dropzone and it's handler
    let image = null
    let imageCroppie = null
    let dropzone = new Dropzone ('#file-select', {
        url: document.location.href,
        autoProcessQueue: false,
        addedfile: file => console.log,
        accept: file => {
            // Loads our object URL and loads into the cropping box
            image = new Image()
            image.onload = () => {
                // Load Croppie
                let viewportSize = $main.outerHeight() / 3
                imageCroppie = new Croppie($editorPreview[0], {
                    viewport: {
                        type: 'circle',
                        width: viewportSize,
                        height: viewportSize
                    },
                    points: [0, 0, 0, 0],
                    zoom: 0
                })

                // Next screen
                this.next()

                // Show footer
                setTimeout(() => {
                    $footer.addClass('visible')

                    // Update croppie (fixes bad position)
                    setTimeout(() => {
                        imageCroppie.setZoom(1)
                        setTimeout(() => { imageCroppie.setZoom(0) }, 1)
                    }, 350)
                }, 350)
            }

            // Start loading image
            image.src = URL.createObjectURL(file)
            $editorPreview = $('#editor-crop').attr('src', image.src)
        },
    })

    // Finishes the cropping phase
    let croppedImage = null
    $('#btn-finish-crop').on('click', () => {
        // Gets the result of the cropped image
        imageCroppie.result('rawcanvas', 'original')
            .then(croppedImageRaw => {
                // Appends the canvas to the header, where it will be our preview
                $header.append(currentEditPreview)

                // Performs resize
                this.downscaler.downScaleCanvas(croppedImageRaw, croppedImageRaw.width / imageSize)

                // Sets croppedImage to the current image
                croppedImage = croppedImageRaw

                // Hides the cropper
                $footer.removeClass('visible')

                // Animation wait
                setTimeout(() => {
                    // Goes to next page
                    this.next()

                    // Another animation...
                    setTimeout(() => {
                        // Show the header where the final result will be previewed
                        $header.addClass('visible')

                        // Applies sample border
                        applyImageBorder(croppedImage, currentHue, currentSat, currentVal)
                    }, 350)
                }, 350)
            })
    })

    // Creates the color slider
    $colorSlider = $('.color-slider').each((i, slider) => {
        // Initialize as a jQuery object
        $slider = $(slider)

        // Creates the slider range control
        let input = $('<input type="range" min="0" max="359" value="0" />')
            .appendTo($slider)
            .on('change', e => {
                currentHue = input.val()
                applyImageBorder(croppedImage, currentHue, currentSat, currentVal)
            })
    })

    // Finishes the editing
    $('#btn-finish-edit').on('click', () => {
        this.next()
    })

    // GameAlchemist's Downscale Algorithm
    this.downscaler = {
        // scales the image by (float) scale < 1
        // returns a canvas containing the scaled image.
        downScaleImage (img, scale) {
            var imgCV = document.createElement('canvas');
            imgCV.width = img.width;
            imgCV.height = img.height;
            var imgCtx = imgCV.getContext('2d');
            imgCtx.drawImage(img, 0, 0);
            return this.downscaler.downScaleCanvas(imgCV, scale);
        },

        // scales the canvas by (float) scale < 1
        // returns a new canvas containing the scaled image.
        downScaleCanvas (cv, scale) {
            if (!(scale < 1) || !(scale > 0)) throw ('scale must be a positive number <1 ');
            var sqScale = scale * scale; // square scale = area of source pixel within target
            var sw = cv.width; // source image width
            var sh = cv.height; // source image height
            var tw = Math.floor(sw * scale); // target image width
            var th = Math.floor(sh * scale); // target image height
            var sx = 0, sy = 0, sIndex = 0; // source x,y, index within source array
            var tx = 0, ty = 0, yIndex = 0, tIndex = 0; // target x,y, x,y index within target array
            var tX = 0, tY = 0; // rounded tx, ty
            var w = 0, nw = 0, wx = 0, nwx = 0, wy = 0, nwy = 0; // weight / next weight x / y
            // weight is weight of current source point within target.
            // next weight is weight of current source point within next target's point.
            var crossX = false; // does scaled px cross its current px right border ?
            var crossY = false; // does scaled px cross its current px bottom border ?
            var sBuffer = cv.getContext('2d').
                getImageData(0, 0, sw, sh).data; // source buffer 8 bit rgba
            var tBuffer = new Float32Array(3 * tw * th); // target buffer Float32 rgb
            var sR = 0, sG = 0, sB = 0; // source's current point r,g,b
            /* untested !
            var sA = 0;  //source alpha  */

            for (sy = 0; sy < sh; sy++) {
                ty = sy * scale; // y src position within target
                tY = 0 | ty;     // rounded : target pixel's y
                yIndex = 3 * tY * tw;  // line index within target array
                crossY = (tY != (0 | ty + scale));
                if (crossY) { // if pixel is crossing botton target pixel
                    wy = (tY + 1 - ty); // weight of point within target pixel
                    nwy = (ty + scale - tY - 1); // ... within y+1 target pixel
                }
                for (sx = 0; sx < sw; sx++ , sIndex += 4) {
                    tx = sx * scale; // x src position within target
                    tX = 0 | tx;    // rounded : target pixel's x
                    tIndex = yIndex + tX * 3; // target pixel index within target array
                    crossX = (tX != (0 | tx + scale));
                    if (crossX) { // if pixel is crossing target pixel's right
                        wx = (tX + 1 - tx); // weight of point within target pixel
                        nwx = (tx + scale - tX - 1); // ... within x+1 target pixel
                    }
                    sR = sBuffer[sIndex];   // retrieving r,g,b for curr src px.
                    sG = sBuffer[sIndex + 1];
                    sB = sBuffer[sIndex + 2];

                    /* !! untested : handling alpha !!
                    sA = sBuffer[sIndex + 3];
                    if (!sA) continue;
                    if (sA != 0xFF) {
                        sR = (sR * sA) >> 8;  // or use /256 instead ??
                        sG = (sG * sA) >> 8;
                        sB = (sB * sA) >> 8;
                    }
                    */
                    if (!crossX && !crossY) { // pixel does not cross
                        // just add components weighted by squared scale.
                        tBuffer[tIndex] += sR * sqScale;
                        tBuffer[tIndex + 1] += sG * sqScale;
                        tBuffer[tIndex + 2] += sB * sqScale;
                    } else if (crossX && !crossY) { // cross on X only
                        w = wx * scale;
                        // add weighted component for current px
                        tBuffer[tIndex] += sR * w;
                        tBuffer[tIndex + 1] += sG * w;
                        tBuffer[tIndex + 2] += sB * w;
                        // add weighted component for next (tX+1) px                
                        nw = nwx * scale
                        tBuffer[tIndex + 3] += sR * nw;
                        tBuffer[tIndex + 4] += sG * nw;
                        tBuffer[tIndex + 5] += sB * nw;
                    } else if (crossY && !crossX) { // cross on Y only
                        w = wy * scale;
                        // add weighted component for current px
                        tBuffer[tIndex] += sR * w;
                        tBuffer[tIndex + 1] += sG * w;
                        tBuffer[tIndex + 2] += sB * w;
                        // add weighted component for next (tY+1) px                
                        nw = nwy * scale
                        tBuffer[tIndex + 3 * tw] += sR * nw;
                        tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                        tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                    } else { // crosses both x and y : four target points involved
                        // add weighted component for current px
                        w = wx * wy;
                        tBuffer[tIndex] += sR * w;
                        tBuffer[tIndex + 1] += sG * w;
                        tBuffer[tIndex + 2] += sB * w;
                        // for tX + 1; tY px
                        nw = nwx * wy;
                        tBuffer[tIndex + 3] += sR * nw;
                        tBuffer[tIndex + 4] += sG * nw;
                        tBuffer[tIndex + 5] += sB * nw;
                        // for tX ; tY + 1 px
                        nw = wx * nwy;
                        tBuffer[tIndex + 3 * tw] += sR * nw;
                        tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                        tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                        // for tX + 1 ; tY +1 px
                        nw = nwx * nwy;
                        tBuffer[tIndex + 3 * tw + 3] += sR * nw;
                        tBuffer[tIndex + 3 * tw + 4] += sG * nw;
                        tBuffer[tIndex + 3 * tw + 5] += sB * nw;
                    }
                } // end for sx 
            } // end for sy

            // create result canvas
            var resCV = document.createElement('canvas');
            resCV.width = tw;
            resCV.height = th;
            var resCtx = resCV.getContext('2d');
            var imgRes = resCtx.getImageData(0, 0, tw, th);
            var tByteBuffer = imgRes.data;
            // convert float32 array into a UInt8Clamped Array
            var pxIndex = 0; //  
            for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 3, tIndex += 4, pxIndex++) {
                tByteBuffer[tIndex] = Math.ceil(tBuffer[sIndex]);
                tByteBuffer[tIndex + 1] = Math.ceil(tBuffer[sIndex + 1]);
                tByteBuffer[tIndex + 2] = Math.ceil(tBuffer[sIndex + 2]);
                tByteBuffer[tIndex + 3] = 255;
            }
            // writing result to canvas.
            resCtx.putImageData(imgRes, 0, 0);
            return resCV;
        }
    }

    // Returns the api
    return this
})(jQuery)
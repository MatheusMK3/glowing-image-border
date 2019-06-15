App = ($ => {
    // Layout stuff
    const $app = $('#app')
    const $main = $('main').first()
    const $header = $('header').first()
    const $footer = $('footer').first()
    const $sections = $main.children('.container').children('section')

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
                    points: [0, 0, image.width, image.height]
                })

                // Next screen
                this.next()

                // Show footer
                setTimeout(() => {
                    $footer.addClass('visible')
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
        imageCroppie.result('rawcanvas', {
            width: 512,
            height: 512
        }, 'png', true)
            .then(croppedImage => {
                // Appends the canvas to the header, where it will be our preview
                $header.append(croppedImage)

                // Hides the cropper
                $footer.removeClass('visible')

                // Animation wait
                setTimeout(() => {
                    // Goes to next page
                    this.next()

                    // Another animation... then we show the header where the final result will be previewed
                    setTimeout(() => { $header.addClass('visible') }, 350)
                }, 350)
            })
    })

    // Returns the api
    return this
})(jQuery)
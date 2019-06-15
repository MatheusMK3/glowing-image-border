App = ($ => {
    // Layout stuff
    const $app = $('#app')
    const $main = $('main').first()
    const $header = $('header').first()
    const $sections = $main.children('section')

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

    // Creates a image variable, preview, dropzone and it's handler
    let image = null
    let imagePreview = $('#file-select')
    let dropzone = new Dropzone ('#file-select', {
        url: document.location.href,
        autoProcessQueue: false,
        addedfile: file => console.log,
        accept: file => {
            image = new Image()
            image.onload = () => {
                this.next()
                // imagePreview.css({ backgroundImage: `url(${image.src})` })
            }
            image.src = URL.createObjectURL(file)
        },
    })

    // Returns the api
    return this
})(jQuery)
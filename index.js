const fs = require('fs')

// Maps directories and files to copy over
const map_copy = [
    { src: 'js', dst: 'js' },
    { src: 'css', dst: 'css' },
    { src: 'res', dst: 'res' },
    { src: 'index.html', dst: 'index.html' },
    { src: 'node_modules', dst: 'vendor' },
]

// File rewrites
const rewrites = [
    { on: ['html', 'js', 'css'], find: /node_modules/gi, repl: 'vendor' },
]

// Make a new dist directory
if (!fs.existsSync('dist'))
    fs.mkdirSync('dist')

// Processes rewrites extension list
let rewrites_allowed = []
rewrites.map(rewrite => {
    rewrites_allowed = rewrites_allowed.concat(rewrite.on)
    return rewrite
})

// Processes copy list
map_copy.map(copy => walkFileCopy(copy.src, `dist/${copy.dst}`))

// Our walk function
function walkFileCopy (file, dest) {
    console.log(`Copying '${file}' to '${dest}'...`)
    
    try {
        // Check if is directory
        if (fs.statSync(file).isDirectory()) {
            // If so, create a mirror directory
            if (!fs.existsSync(dest))
                fs.mkdirSync(dest)

            // Then get a listing and walk into the target directory
            let files = fs.readdirSync(file)
            files.map(subFile => walkFileCopy(`${file}/${subFile}`, `${dest}/${subFile}`))
        } else {
            // Gets file extension
            let extension = file.split('.').reverse()[0]

            // Test if file extension is on the extensions allowed for rewrite (requires non-binary copy mode)
            if (~rewrites_allowed.indexOf(extension)) {
                // Opens current file
                let fileContent = fs.readFileSync(file).toString()
                
                // Processes rewrites
                rewrites.map(rewrite => {
                    fileContent = fileContent.replace(rewrite.find, rewrite.repl)
                })

                // Writes new file
                fs.writeFileSync(dest, fileContent)
            } else {
                // Standard copy
                fs.copyFileSync(file, dest)
            }
        }
    } catch (e) {
        console.error(`ERROR:`, e)
    }
}
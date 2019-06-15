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
    { find: /node_modules/gi, repl: 'vendor' },
]

// Make a new dist directory
if (!fs.existsSync('dist'))
    fs.mkdirSync('dist')

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
            // Opens current file
            let fileContent = fs.readFileSync(file).toString()
            
            // Processes rewrites
            rewrites.map(rewrite => {
                console.log(rewrite)
                fileContent = fileContent.replace(rewrite.find, rewrite.repl)
            })

            // Writes new file
            fs.writeFileSync(dest, fileContent)
        }
    } catch (e) {
        console.error(`ERROR:`, e)
    }
}
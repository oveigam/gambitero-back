module.exports = (fileName) => {
    const key = fileName.substr(fileName.lastIndexOf('/') + 1);
    return key
}
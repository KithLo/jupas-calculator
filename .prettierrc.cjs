module.exports = {
    tabWidth: 4,
    semi: false,
    singleQuote: false,
    trailingComma: "all",
    endOfLine: "lf",
    printWidth: 80,
    overrides: [
        {
            files: ["**/*.yml"],
            options: {
                tabWidth: 2,
            }
        },
    ]
}

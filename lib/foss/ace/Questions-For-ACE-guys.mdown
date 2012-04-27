# Questions for Ace editor guys (Friday)


1. Get an idea of the editor hierarchy
2. Best way to hook up events en masse
3. Touch scrolling
4. How to re-indent a document
5. Have editor.find return a value
6. Ranges are never fixed for screen vs editor line numbers
7. Editor.navigateLineStart has inconsistent behaviour
    1. When the carat is before any non-whitespace character, the function moves to the 0th column in the line
    2. Otherwise the function moves the carat to before the first non-whitespace character
8. Folded lines are a one-shot. Can we have folds that can be refolded by double clicking?

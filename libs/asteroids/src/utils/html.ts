/**
 * Gets a HTML element according to the given file name.
 *
 * @param fileName The file that will be read.
 * @param selector The element to be created.
 * @returns A HTML element.
 *
 * @example
 * getHtml('menu', 'ast-menu')
 */
export async function getHtml(fileName: string, selector: string) {
  const path = `${window.location.origin}}/assets/html/${fileName}.html`
  const response = await fetch(path)
  const blob = await response.blob()
  const text = await blob.text()

  const html = createElement(selector)
  html.innerHTML = text.split('</head>')[1]

  return html
}

/**
 * Creates a HTML element.
 *
 * @param element The element name.
 * @returns The created element.
 *
 * @example
 * createElement<HTMLButtonElement>('button')
 */
export function createElement<T extends HTMLElement>(element: string) {
  return document.createElement(element) as T
}

/**
 * Gets a HTML element according to the given selector.
 *
 * @param selector The selector that identifies the element.
 * @returns The HTML element that corresponds to the given selector.
 *
 * @example
 * getElement<HTMLButtonElement>('button.button-class')
 */
export function getElement<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector)
}

/**
 * Gets multiple HTML elements according to the given selector.
 *
 * @param selector The selector that identifies the element.
 * @returns An array of HTML elements that corresponds to the given selector.
 *
 * @example
 * getMultipleElements('button')
 */
export function getMultipleElements(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll(selector))
}

/**
 * Adds one or more classes to an element according to the given element.
 *
 * @param element The HTML element / selector that identifies the element.
 * @param classes The classes to be added.
 *
 * @example
 * addClass<HTMLButtonElement>('button.button-class', 'active')
 * // or
 * const button = getElement<HTMLButtonElement>('button.button-class')
 * addClass(button, 'active')
 */
export function addClass<T extends HTMLElement>(
  element: string | T,
  ...classes: string[]
) {
  if (typeof element === 'string') {
    return getElement<T>(element)?.classList.add(...classes)
  }

  element?.classList.add(...classes)
}

/**
 * Removes one or more classes from an element according to the given element.
 *
 * @param element The HTML element / selector that identifies the element.
 * @param classes The classes to be removed.
 *
 * @example
 * removeClass<HTMLButtonElement>('button.button-class', 'active')
 * // or
 * const button = getElement<HTMLButtonElement>('button.button-class')
 * removeClass(button, 'active')
 */
export function removeClass<T extends HTMLElement>(
  element: string | T,
  ...classes: string[]
) {
  if (typeof element === 'string') {
    return getElement<T>(element)?.classList.remove(...classes)
  }

  element?.classList.remove(...classes)
}

/**
 * Appends one or more children elements to a node according to the given element.
 *
 * @param element The HTML element / selector that identifies the parent element.
 * @param children The children HTML elements.
 *
 * @example
 * const child = createElement('div')
 *
 * appendChildren<HTMLDivElement>('.container', child)
 * // or
 * const parent = getElement<HTMLDivElement>('.container')
 * appendChildren(parent, child)
 */
export function appendChildren<T extends HTMLElement>(
  element: string | T,
  ...children: HTMLElement[]
) {
  if (typeof element === 'string') {
    return getElement<T>(element)?.append(...children)
  }

  element?.append(...children)
}

/**
 * Removes one or more children elements from it's parent according to the given
 * element.
 *
 * @param element The HTML element / selector that identifies the parent element.
 * @param children The children HTML elements.
 *
 * @example
 * const child = getElement('.child-element')
 *
 * removeChildren<HTMLDivElement>('.container', child)
 * // or
 * const parent = getElement<HTMLDivElement>('.container')
 * removeChildren(parent, child)
 */
export function removeChildren<T extends HTMLElement>(
  element: string | T,
  ...children: HTMLElement[]
) {
  if (typeof element === 'string') {
    const el = getElement<T>(element)
    return children.forEach((child) => el?.removeChild(child))
  }

  children.forEach((child) => element?.removeChild(child))
}

/**
 * Destroys an element from the HTML structure.
 *
 * @param element The HTML element / selector that identifies the element.
 *
 * @example
 * destroyElement('button.button-class')
 * // or
 * const button = getElement('button.button-class')
 * destroyElement(button)
 */
export function destroyElement(element: string | HTMLElement) {
  if (typeof element === 'string') {
    return getElement(element)?.remove()
  }

  element?.remove()
}

/**
 * Destroys multiple elements from the HTML structure.
 *
 * @param element The HTML elements / selector that identifies the elements.
 *
 * @example
 * destroyMultipleElements('button')
 * // or
 * const button1 = getElement('button.button-class-1')
 * const button2 = getElement('button.button-class-2')
 * destroyMultipleElements([button1, button2])
 */
export function destroyMultipleElements(element: string | HTMLElement[]) {
  if (typeof element === 'string') {
    return getMultipleElements(element).forEach((el) => el.remove())
  }

  element.forEach((el) => el.remove())
}

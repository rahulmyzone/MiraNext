export function fetchExternal(url, options = {}) {
  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // or response.text() for plain text
    });
}
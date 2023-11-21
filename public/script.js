// OAUTH. TODO: Separate these into a different file.
const decodeJWT = token =>
  JSON.parse(decodeURIComponent(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));

function handleCredentialResponse({ credential }) {
  localStorage.setItem('credential', credential);
  navigateTo(window.location.pathname);
}

const isSignedIn = () => {
  const credential = localStorage.getItem('credential');
  if (!credential)
    return false;
  const { exp, given_name } = decodeJWT(credential);
  console.log(decodeJWT(credential));
  const result = exp > Date.now() / 1000;
  if (result) {
    document.querySelector('.g_id_signin').hidden = true;
    document.querySelectorAll('.signout').forEach(node => node.remove());
    document.querySelector('nav').appendChild(Object.assign(document.createElement('h2'), { textContent: `Hi, ${given_name}`, className: "signout" }));
    document.querySelector('nav').appendChild(Object.assign(document.createElement('button'), { textContent: "Sign Out", className: "signout" })).onclick = handleSignOut;
  } else {
    handleSignOut();
  }
  return result;
}

const handleSignOut = () => {
  localStorage.removeItem('credential');
  document.querySelectorAll('.signout').forEach(node => node.remove());
  document.querySelector('.g_id_signin').hidden = false;
}

// Main Code
const BASE_URL = "https://chapmanganato.com"

const search = async () => navigateTo(`/search/story/${document.getElementById('textBox').value.replaceAll(' ', '_')}`);

const navigateTo = path => {
  history.pushState(null, null, path);
  handleNavigation(path);
};

const handleNavigation = path => {
  console.log(isSignedIn());
  document.querySelector('.content') && document.querySelector('.content').remove();
  const content = Object.assign(document.createElement('div'), { className: "content" });
  document.body.appendChild(content);
  switch (true) {
    case path.startsWith('/search/story/'):
      fetchTextContents(BASE_URL + path, 'item-title', content);
      break;
    case path.startsWith('/manga-') && path.includes('/chapter-'):
      getImages(BASE_URL + path, content);
      break;
    case path.startsWith('/manga-'):
      fetchTextContents(BASE_URL + path, 'chapter-name', content);
      break;
    default:
      break;
  }
};

window.addEventListener('popstate', () => {
  handleNavigation(document.location.pathname);
});

const fetchTextContents = async (url, className, content) => {
  const html = await (await fetch(`/search?url=${url}`)).text();
  Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll(`.${className}`))
    .forEach(({ textContent, href }) => {
      const node = content.appendChild(Object.assign(document.createElement('div'), { textContent, className }));
      node.addEventListener('click', () => navigateTo(new URL(href).pathname));
    });
};

const getImages = async (url, content) => {
  const html = new DOMParser().parseFromString(await (await fetch(`/search?url=${url}`)).text(), 'text/html');
  const addButtons = () => {
    const buttonContainer = content.appendChild(Object.assign(document.createElement('div'), { className: "button-container" }));
    [html.querySelector('.navi-change-chapter-btn-prev'), html.querySelector('.navi-change-chapter-btn-next')]
      .filter(Boolean)
      .forEach(({ textContent, href }) => {
        buttonContainer.appendChild(Object.assign(document.createElement('button'), { textContent, className: "chapter-button" }))
          .onclick = () => navigateTo(new URL(href).pathname);
      })
  };
  content.appendChild(Object.assign(document.createElement('h1'), { textContent: (html.querySelector('h1') || {}).textContent }));
  addButtons();
  for (const { src } of Array.from(html.querySelectorAll('img'))) {
    try {
      content.appendChild(Object.assign(document.createElement('img'), { src: `/images/${await (await fetch(`/image?url=${src}`)).text()}` }));
    } catch (error) {
      console.error(`Error fetching image: ${src}`, error);
    }
  }
  addButtons();
};

handleNavigation(document.location.pathname);

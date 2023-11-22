// OAUTH. TODO: Separate these into a different file.
const decodeJWT = token =>
  JSON.parse(decodeURIComponent(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));

// Doc: https://developers.google.com/identity/gsi/web/reference/js-reference#credential
function handleCredentialResponse({ credential }) {
  localStorage.setItem('credential', credential);
  navigateTo(window.location.pathname);
}

const isSignedIn = () => {
  const credential = localStorage.getItem('credential');
  if (!credential)
    return false;
  const { exp, given_name, email } = decodeJWT(credential);
  const result = exp > Date.now() / 1000;
  if (result) {
    document.querySelector('.g_id_signin').hidden = true;
    document.querySelectorAll('.signout,.my-list').forEach(node => node.remove());
    document.querySelector('.nav-buttons').appendChild(Object.assign(document.createElement('button'), { textContent: "My List", className: "my-list" })).onclick = () => navigateTo('/mylist');
    document.querySelector('.user-info').appendChild(Object.assign(document.createElement('h2'), { textContent: `Hi, ${given_name}`, className: "signout" }));
    document.querySelector('.user-info').appendChild(Object.assign(document.createElement('button'), { textContent: "Sign Out", className: "signout" })).onclick = handleSignOut;
  } else {
    handleSignOut();
  }
  return email;
}

const handleSignOut = () => {
  localStorage.removeItem('credential');
  document.querySelectorAll('.signout,.my-list').forEach(node => node.remove());
  document.querySelector('.g_id_signin').hidden = false;
  navigateTo(window.location.pathname);
}

// Main Code
const BASE_URL = "https://chapmanganato.com"

const search = async () => navigateTo(`/search/story/${document.getElementById('textBox').value.replaceAll(' ', '_')}`);

const navigateTo = path => {
  history.pushState(null, null, path);
  handleNavigation(path);
};

const handleNavigation = async path => {
  const userId = isSignedIn();
  document.querySelector('.content') && document.querySelector('.content').remove();
  const content = Object.assign(document.createElement('div'), { className: "content" });
  document.body.appendChild(content);
  switch (true) {
    case path.startsWith('/search/story/'):
      fetchTextContents(BASE_URL + path, 'item-title', content);
      break;
    case path.startsWith('/manga-') && path.includes('/chapter-'):
      await fetch(`/images?userId=${userId}`, { method: 'DELETE' });
      getImages(BASE_URL + path, content);
      break;
    case path.startsWith('/manga-'):
      fetchTextContents(BASE_URL + path, 'chapter-name', content);
      break;
    case path.startsWith('/mylist'):
      if (!userId)
        navigateTo('/');
      renderList(content);
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
      const node = content.appendChild(Object.assign(document.createElement('a'), { textContent, className, href: new URL(href).pathname }));
    });
};

const getImages = async (url, content) => {
  const html = new DOMParser().parseFromString(await (await fetch(`/search?url=${url}`)).text(), 'text/html');
  const [title, chapter] = Array.from(html.querySelectorAll('.a-h')).slice(1, 3);
  const userId = isSignedIn();
  const addChapterButtons = () => {
    const buttonContainer = content.appendChild(Object.assign(document.createElement('div'), { className: "button-container" }));
    [html.querySelector('.navi-change-chapter-btn-prev'), html.querySelector('.navi-change-chapter-btn-next')]
    .filter(Boolean)
    .forEach(({ textContent, href }) => {
      buttonContainer.appendChild(Object.assign(document.createElement('button'), { textContent, className: "chapter-button" }))
      .onclick = () => navigateTo(new URL(href).pathname);
    })
  };
  if (userId) {
    const list = await (await fetch(`/list?userId=${userId}&title=${title.title}&chapter=${chapter.title}`)).json();
    content.appendChild(Object.assign(document.createElement('button'), { textContent: list.length > 0? 'Remove From List' : 'Save To List' }))
      .onclick = async e => {
        const isSaved = e.target.textContent == 'Remove From List';
        if (isSaved)
          await fetch(`/list?id=${list[0]._id}`, { method: 'DELETE' });
        else
          await fetch(`/list`, { method: 'POST', body: JSON.stringify({ userId, title: title.title, chapter: chapter.title, url: window.location.pathname }) });
        navigateTo(window.location.pathname);
      };
  }
  
  const titleContainer = Object.assign(document.createElement('div'), { className: "title-container" });
  content.appendChild(titleContainer);
  titleContainer.appendChild(Object.assign(document.createElement('a'), { textContent: title.title, href: new URL(title.href).pathname }));
  titleContainer.appendChild(Object.assign(document.createElement('span'), { textContent: " >> " }));
  titleContainer.appendChild(Object.assign(document.createElement('span'), { textContent: `${chapter.title}` }));
  addChapterButtons();
  for (const { src } of Array.from(html.querySelectorAll('img'))) {
    try {
      content.appendChild(Object.assign(document.createElement('img'), { src: `/images/${await (await fetch(`/image?url=${src}&userId=${userId}`)).text()}` }));
    } catch (error) {
      console.error(`Error fetching image: ${src}`, error);
    }
  }
  addChapterButtons();
};

const renderList = async content => {
  const list = await (await fetch(`/list?userId=${isSignedIn()}`)).json();
  content.appendChild(Object.assign(document.createElement('h1'), { textContent: "My List" }));
  list.forEach(book => {
    const container = Object.assign(document.createElement('div'), { className: "book-container" });
    content.appendChild(container);
    container.appendChild(Object.assign(document.createElement('span'), { textContent: book.title + ": " }));
    container.appendChild(Object.assign(document.createElement('a'), { textContent: book.chapter, href: book.url }));
  });
}

handleNavigation(document.location.pathname);

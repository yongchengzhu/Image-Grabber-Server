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
  const { iat, given_name, email } = decodeJWT(credential);
  if (iat + 604800 > Date.now() / 1000) {
    document.querySelector('.g_id_signin').hidden = true;
    document.querySelectorAll('.signout,.my-list').forEach(node => node.remove());
    document.querySelector('.nav-buttons').appendChild(Object.assign(document.createElement('button'), { textContent: "My List", className: "my-list" })).onclick = () => navigateTo('/mylist');
    document.querySelector('.user-info').appendChild(Object.assign(document.createElement('h2'), { textContent: `Hi, ${given_name}`, className: "signout" }));
    document.querySelector('.user-info').appendChild(Object.assign(document.createElement('button'), { textContent: "Sign Out", className: "signout" })).onclick = handleSignOut;
    return email;
  }
  handleSignOut();
  return false;
}

const handleSignOut = () => {
  localStorage.removeItem('credential');
  document.querySelectorAll('.signout,.my-list').forEach(node => node.remove());
  document.querySelector('.g_id_signin').hidden = false;
  navigateTo(window.location.pathname);
}

// Main Code
const BASE_URL_1 = "https://chapmanganato.com"
const BASE_URL_2 = "https://manganato.com"

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
      fetchBooks(BASE_URL_2 + path, 'search-story-item', content);
      break;
    case path.startsWith('/manga-') && path.includes('/chapter-'):
      await fetch(`/images?userId=${userId}`, { method: 'DELETE' });
      getImages(BASE_URL_1 + path, content);
      break;
    case path.startsWith('/manga-'):
      fetchTextContents(BASE_URL_1 + path, 'chapter-name', content);
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
      content.appendChild(Object.assign(document.createElement('a'), { textContent, className, href: new URL(href).pathname }));
    });
};

const fetchBooks = async (url, className, content) => {
  const html = await (await fetch(`/search?url=${url}`)).text();
  Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll(`.${className}`))
    .forEach((book) => {
      const { textContent, href } = book.querySelector('.item-title');
      const { src } = book.querySelector('img');
      content.appendChild(Object.assign(document.createElement('a'), { textContent, className, href: new URL(href).pathname }))
      content.appendChild(Object.assign(document.createElement('img'), { src }));
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
  for (const image of Array.from(html.querySelectorAll('img'))) {
    image.data = image.src;
    image.src = 'https://placehold.co/386x567';
    content.appendChild(image);
  }
  const promises = Array.from(content.querySelectorAll('img')).map((img, index) => {
    console.log('index', index);
    return new Promise(async (resolve) => {
      fetch(`/images/${await (await fetch(`/image?url=${img.data}&userId=${userId}&index=${index}`, { timeout: 100000000, })).text()}`, { timeout: 100000000, })
        .then(response => response.body)
        .then(rs => {
          const reader = rs.getReader();
          return new ReadableStream({
            async start(controller) {
              while (true) {
                const { done, value } = await reader.read();
                if (done)
                  break;
                controller.enqueue(value);
              }
              controller.close();
              reader.releaseLock();
            }
          });
        })
        .then(rs => new Response(rs))
        .then(response => response.blob())
        .then(blob => URL.createObjectURL(blob))
        .then(async url => {
          img.src = url;
          await fetch(`/image?userId=${userId}&page=${index}`, { method: 'DELETE' });
          resolve();
        })
        .catch(console.error);
    });
  });
  await Promise.all(promises);
  addChapterButtons();
};

const renderList = async content => {
  const list = await (await fetch(`/list?userId=${isSignedIn()}`)).json();
  
  const table = Object.assign(document.createElement('table'));
  content.appendChild(table);
  const header = document.createElement('tr');
  header.appendChild(Object.assign(document.createElement('th'), { textContent: 'Title' }))
  header.appendChild(Object.assign(document.createElement('th'), { textContent: 'Last Read' }))
  header.appendChild(Object.assign(document.createElement('th'), { textContent: 'Newest Chapter' }))
  table.appendChild(header);
  list.forEach(async book => {
    const html = new DOMParser().parseFromString(await (await fetch(`/search?url=${BASE_URL_1 + book.url.split("/").slice(0, -1).join('/')}`)).text(), 'text/html');
    const image = html.querySelector(".info-image>img");
    const newestChapter = new DOMParser().parseFromString(await (await fetch(`/search?url=${BASE_URL_1}/${book.url.split('/')[1]}`)).text(), 'text/html').querySelector('.chapter-name');
    const row = Object.assign(document.createElement('tr'));
    const bookTitle = document.createElement('td');
    const newestChapterTitle = document.createElement('td');
    const newestChapterLink = document.createElement('td');
    bookTitle.appendChild(Object.assign(document.createElement('a'), { textContent: book.title, href: new URL(newestChapter.href).pathname.split('/')[1]  }));
    bookTitle.appendChild(Object.assign(document.createElement('img'), { src: image? image.src : "", style: "margin:auto;display:block" }));
    newestChapterTitle.appendChild(Object.assign(document.createElement('a'), { textContent: book.chapter, href: book.url }));
    newestChapterLink.appendChild(document.createElement('td').appendChild(Object.assign(document.createElement('a'), { textContent: newestChapter.textContent, href: new URL(newestChapter.href).pathname })));
    row.appendChild(bookTitle);
    row.appendChild(newestChapterTitle);
    row.appendChild(newestChapterLink);
    table.appendChild(row);
  });
}

handleNavigation(document.location.pathname);

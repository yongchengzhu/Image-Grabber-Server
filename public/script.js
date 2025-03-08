const BASE_URL_1 = "https://natomanga.com"
const BASE_URL_2 = "https://natomanga.com"

// Recent Updates Modal logic
document.querySelector('.nav-buttons').appendChild(Object.assign(document.createElement('button'), { textContent: "See Recent Updates", className: "open-recent-books-modal" })).onclick = async e => {
  const recentBooksUpdateModal = document.querySelector('#recent-books-modal');
  recentBooksUpdateModal.style.display = "flex";
  recentBooksUpdateModal.style.flexDirection = "column";
  const html = await (await fetch(`/search?url=${BASE_URL_2}`)).text();
  Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll(`.content-homepage-item`))
    .forEach(async recentBook => {
      const { textContent, href } = recentBook.querySelector('.item-title > a');
      const html = await (await fetch(`/search?url=${href}`)).text();
      const genres = Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('.table-value > [href*="genre"]')).map(genre => genre.textContent);
      console.log(genres)
      const src = recentBook.querySelector('img').src;
      const chapterInformation = recentBook.querySelectorAll('.item-chapter > a');
      const recentBooksContainer = recentBooksUpdateModal.querySelector('#recent-books-modal-content')
        .appendChild(Object.assign(document.createElement('div'), { className: "recent-books-container" }));
      recentBooksContainer.appendChild(Object.assign(document.createElement('img'), { src, className: "recent-books-cover-image" }));
      const recentBookInformation = recentBooksContainer.appendChild(Object.assign(document.createElement('div'), { src, className: "recent-books-information" }));
      recentBookInformation.appendChild(Object.assign(document.createElement('a'), { textContent, className: "recent-books-title", href: new URL(href).pathname }))
      recentBookInformation.appendChild(Object.assign(document.createElement('div'), { textContent: `Genres: ${genres.join(", ")}`, className: "recent-books-genre" }))
      chapterInformation.forEach(({ textContent, href }) =>
        recentBookInformation.appendChild(Object.assign(document.createElement('a'), { textContent, className: "recent-books-chapter", href: new URL(href).pathname }))
      )
    });
}
document.querySelector('#close-recent-books-modal').onclick = () => {
  document.querySelector('#recent-books-modal').style.display = 'none';
  document.querySelector('#recent-books-modal-content').textContent = '';
}
window.onclick = e => {
  if (e.target.id !== 'recent-books-modal' && !e.target.classList.contains('open-recent-books-modal'))
    document.querySelector('#recent-books-modal').style.display = 'none';
}

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
      console.log("in search sotry")
      fetchBooks(BASE_URL_2 + path, 'story_item', content);
      break;
    case path.startsWith('/manga') && path.includes('/chapter'):
      console.log("in manga chapter images")
      await fetch(`/images?userId=${userId}`, { method: 'DELETE' });
      getImages(BASE_URL_1 + path, content);
      break;
    case path.startsWith('/manga'):
      console.log('in manga chapter list')
      fetchTextContents(BASE_URL_1 + path, 'chapter-list > .row > span > a', content);
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
      const { textContent, href } = book.querySelector('.story_name > a');
      const { src } = book.querySelector('img');
      console.log('src = ', src)
      content.appendChild(Object.assign(document.createElement('a'), { textContent, className, href: new URL(href).pathname }))
      content.appendChild(Object.assign(document.createElement('img'), { src }));
    });
};

const getImages = async (url, content) => {
  const html = new DOMParser().parseFromString(await (await fetch(`/search?url=${url}`)).text(), 'text/html');
  const [title, chapter] = Array.from(html.querySelectorAll('span[itemprop="name"]')).slice(1, 3);
  console.log('title', title)
  const userId = isSignedIn();
  const addChapterButtons = () => {
    const buttonContainer = content.appendChild(Object.assign(document.createElement('div'), { className: "button-container" }));
    [html.querySelector('a.back'), html.querySelector('a.next')]
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
  titleContainer.appendChild(Object.assign(document.createElement('a'), { textContent: title.textContent, href: new URL(title.parentNode.href).pathname }));
  titleContainer.appendChild(Object.assign(document.createElement('span'), { textContent: " >> " }));
  titleContainer.appendChild(Object.assign(document.createElement('span'), { textContent: `${chapter.textContent}` }));
  addChapterButtons();
  for (const image of Array.from(html.querySelectorAll('img'))) {
    image.data = image.src;
    image.src = 'https://placehold.co/386x567';
    content.appendChild(image);
  }
  const promises = Array.from(content.querySelectorAll('img')).map((img, index) => {
    console.log('img', img.data);
    return new Promise(async (resolve) => {
      fetch(`/images/${await (await fetch(`/image?url=${img.data.replace('virus2hub.com', '2xstorage.com')}&userId=${userId}&index=${index}`, { timeout: 100000000, })).text()}`, { timeout: 100000000, })
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
    console.log(`/search?url=${BASE_URL_1}/manga/${book.title.toLowerCase().replace(/\s+/g, '-')}`)
    // console.log(new DOMParser().parseFromString(await (await fetch(`/search?url=${BASE_URL_1}/manga/${book.title.toLowerCase().replace(/\s+/g, '-')}}`)).text(), 'text/html').querySelector('body'))
    const newestChapter = new DOMParser().parseFromString(await (await fetch(`/search?url=${BASE_URL_1}/manga/${book.title.toLowerCase().replace(/\s+/g, '-')}`)).text(), 'text/html').querySelector('.chapter-list > .row > span > a');
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

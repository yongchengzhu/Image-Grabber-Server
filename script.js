const getImages = async (url) => {
  document.querySelector('.content').innerHTML = '';
  const html = await (await fetch(`/search?url=${url}`)).text();
  const images = Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('img')).map(img => img.src);
  for (const image of images) {
    const imageData = await (await fetch(`/image?url=${image}`)).text();
    document.querySelector('.content').appendChild(Object.assign(document.createElement('img'), { src: `data:image/jpeg;base64,${imageData}` }));
  }
}

const getChapters = async (url) => {
  document.querySelector('.content').innerHTML = '';
  const html = await (await fetch(`/search?url=${url}`)).text();
  const chapters = Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('.chapter-name')).map(div => ({text: div.textContent, link: div.getAttribute('href')}) );
  chapters.forEach(chapter => {
    const result = Object.assign(document.createElement('div'), { textContent: chapter.text, className: "chapter" });
    result.addEventListener('click', () => getImages(chapter.link));
    document.querySelector('.content').appendChild(result);
  });
}

const search = async () => {
  document.querySelector('.content').innerHTML = '';
  const base = 'https://manganato.com/search/story/';
  const keywords = document.getElementById('textBox').value.replace(/\s+/g, '_');;
  const html = await (await fetch(`/search?url=${base + keywords}`)).text();
  const titles = Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('.item-title')).map(div => ({text: div.textContent, link: div.getAttribute('href')}) );
  titles.forEach(title => {
    const result = Object.assign(document.createElement('div'), { textContent: title.text, className: "title" });
    result.addEventListener('click', () => getChapters(title.link));
    document.querySelector('.content').appendChild(result);
  });
}


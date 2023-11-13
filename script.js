const getImages = async (url) => {
  document.querySelector('.content').innerHTML = '';
  const html = await (await fetch(`/search?url=${url}`)).text();
  const images = Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('img')).map(img => img.src);

  for (const image of images) {
    const page = document.createElement('img');
    document.querySelector('.content').appendChild(page);
    try {
      const response = await fetch(`/image?url=${image}`);
      if (!response.ok)
        continue;
      const chunks = [];
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        chunks.push(value);
      }
      const concatenatedChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc.concat(Array.from(chunk)), []));
      const chunkBlob = new Blob([concatenatedChunks], { type: 'image/jpeg' });
      const chunkUrl = URL.createObjectURL(chunkBlob);
      page.onload = () => URL.revokeObjectURL(chunkUrl);
      page.src = chunkUrl;
    } catch (error) {
      console.error(`Error fetching image: ${image}`, error);
    }
  }
};

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


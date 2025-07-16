export async function getFetchAPI(url) {
  try {
    const resp = await fetch(url);
    // const text = type === 'json' ? await resp.json() : await resp.text();
    return resp;
  } catch (error) {
    return error;
  }
}

export async function appendXF(block, xfPath) {
    block.style.display = 'hide';
  const resp = await getFetchAPI(xfPath);
  if (resp.ok) {
    let str = await resp.text();
    const { location } = window;
    if (location.href.includes('localhost') || location.href.includes('.aem.live')) {
      str = str.replaceAll(
        '/etc.clientlibs/',
        'https://stage.heromotocorp.com/etc.clientlibs/',
      );
      str = str.replaceAll(
        '/content/dam/',
        'https://stage.heromotocorp.com/content/dam/',
      );
    }
    const div = document.createElement('div');
    div.innerHTML = str;
    div.querySelectorAll('link').forEach((link) => {
      try {
        const newLink = document.createElement('link');
        newLink.href = link.href
        // newLink.href = link.href.replace('http://localhost:3000', 'https://stage.heromotocorp.com');
        newLink.rel = 'stylesheet';
        document.head.append(newLink);
      } catch (error) {
        console.error(error); // eslint-disable-line
      }
    });
    block.append(div);
    div.querySelectorAll('script').forEach((link) => {
      const exculdeLink = [
        // '/clientlibs/granite/',
        // '/foundation/clientlibs',
      ];
      // debugger;
      if (!exculdeLink.filter((clientLib) => link.src.includes(clientLib)).length) {
        try {
          const newScript = document.createElement('script');
          newScript.src = link.src;
        //   newScript.src = link.src.replace('http://localhost:3000', 'https://stage.heromotocorp.com');
          newScript.type = 'text/javascript';

          document.body.append(newScript);
        } catch (error) {
          console.error(error); // eslint-disable-line
        }
      }
    });
    block.style.display = 'none';
    
    // setTimeout(() => {
    //     // $.noConflict();
    //   const event = new Event('DOMContentLoaded');
    //   // Dispatch the event
    //   document.dispatchEvent(event);
    // });
    // if (window.isLast) {
    // }
    // window.isLast = true;
  }
  return block;
}

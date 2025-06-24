export interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const prompt = url.searchParams.get("prompt");

    // 如果没有 prompt，显示美化版网页
    if (!prompt) {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>AI Image Generator</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
              color: white;
              text-align: center;
              padding: 50px;
            }
            h1 { font-size: 3em; margin-bottom: 20px; }
            input {
              width: 60%;
              padding: 10px;
              font-size: 1.2em;
              border: none;
              border-radius: 5px;
            }
            button {
              padding: 10px 20px;
              font-size: 1.2em;
              margin-left: 10px;
              border: none;
              border-radius: 5px;
              background-color: #ff7f50;
              color: white;
              cursor: pointer;
            }
            button:hover {
              background-color: #ff5722;
            }
            #result {
              margin-top: 30px;
            }
            img {
              max-width: 80%;
              border-radius: 10px;
              margin-top: 20px;
              box-shadow: 0 0 20px rgba(0,0,0,0.5);
            }
          </style>
        </head>
        <body>
          <h1>AI Image Generator</h1>
          <form id="form">
            <input type="text" id="prompt" placeholder="Enter your prompt..."/>
            <button type="submit">Generate</button>
          </form>
          <div id="result"></div>

          <script>
            const form = document.getElementById("form");
            const result = document.getElementById("result");

            form.addEventListener("submit", async (e) => {
              e.preventDefault();
              const prompt = document.getElementById("prompt").value.trim();
              if (!prompt) return;
              result.innerHTML = "<p>Generating image...</p>";
              const response = await fetch("?prompt=" + encodeURIComponent(prompt));
              if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                result.innerHTML = '<img src="' + url + '" />';
              } else {
                result.innerHTML = "<p>Failed to generate image.</p>";
              }
            });
          </script>
        </body>
        </html>
      `;
      return new Response(html, {
        headers: { "content-type": "text/html;charset=UTF-8" }
      });
    }

    // 有 prompt，生成图片
    const inputs = { prompt };

    try {
      const response = await env.AI.run(
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        inputs
      );

      return new Response(response, {
        headers: { "content-type": "image/png" }
      });
    } catch (err) {
      return new Response("Error generating image: " + err, { status: 500 });
    }
  }
}

export interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const prompt = url.searchParams.get("prompt");
    const seedStr = url.searchParams.get("seed");
    const sizeStr = url.searchParams.get("size");

    if (!prompt) {
      // 前端页面
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
            input, select {
              width: 60%;
              padding: 10px;
              font-size: 1.2em;
              border: none;
              border-radius: 5px;
              margin: 5px;
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
            #result { margin-top: 30px; }
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
            <input type="text" id="prompt" placeholder="请输入描述（支持中文）"/><br>
            <select id="size">
              <option value="1024x1024" selected>1024x1024 (默认)</option>
              <option value="1152x896">1152x896</option>
              <option value="896x1152">896x1152</option>
              <option value="512x512">512x512</option>
            </select><br>
            <input type="number" id="seed" placeholder="随机种子（留空为自动随机）"/><br>
            <button type="submit">生成图片</button>
          </form>
          <div id="result"></div>

          <script>
            const form = document.getElementById("form");
            const result = document.getElementById("result");

            form.addEventListener("submit", async (e) => {
              e.preventDefault();
              const prompt = document.getElementById("prompt").value.trim();
              const size = document.getElementById("size").value;
              const seed = document.getElementById("seed").value;
              if (!prompt) return;
              result.innerHTML = "<p>生成中，请稍候...</p>";
              const params = new URLSearchParams();
              params.append("prompt", prompt);
              params.append("size", size);
              if (seed) params.append("seed", seed);
              const response = await fetch("?" + params.toString());
              if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                result.innerHTML = '<img src="' + url + '" />';
              } else {
                const errText = await response.text();
                result.innerHTML = "<p>生成失败: " + errText + "</p>";
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

    try {
      // 翻译中文 prompt -> 英文
      const translationResponse = await env.AI.run("@cf/meta/m2m100-1.2b", {
        text: prompt,
        source_lang: "zh",
        target_lang: "en"
      });
      const translatedPrompt = translationResponse.translations[0].translation_text;

      // 处理尺寸
      let [width, height] = [1024, 1024]; // 默认
      if (sizeStr) {
        const parts = sizeStr.split("x");
        if (parts.length == 2) {
          width = parseInt(parts[0]);
          height = parseInt(parts[1]);
        }
      }

      // 处理种子
      const seed = seedStr ? parseInt(seedStr) : undefined;

      // 生成图片
      const imageResponse = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
        prompt: translatedPrompt,
        width,
        height,
        seed
      });

      return new Response(imageResponse, {
        headers: { "content-type": "image/png" }
      });

    } catch (err: any) {
      return new Response("生成失败: " + err.toString(), { status: 500 });
    }
  }
}

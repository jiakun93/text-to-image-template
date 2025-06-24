export interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const prompt = url.searchParams.get("prompt");

    // 如果没有 prompt，则返回简单网页输入界面
    if (!prompt) {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>AI Image Generator</title>
        </head>
        <body style="font-family: Arial; text-align: center; margin-top: 50px;">
          <h1>Cloudflare AI Image Generator</h1>
          <form method="get">
            <input type="text" name="prompt" placeholder="Enter your prompt" size="50"/>
            <button type="submit">Generate</button>
          </form>
        </body>
        </html>
      `;
      return new Response(html, {
        headers: { "content-type": "text/html;charset=UTF-8" }
      });
    }

    // 有 prompt，调用 AI 生成图片
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
};

// 게시글 로더 모듈
(function () {
  "use strict";

  // URL 파라미터에서 파일명 가져오기
  function getPostFile() {
    const params = new URLSearchParams(window.location.search);
    return params.get("file");
  }

  // 마크다운 파일 로딩
  async function loadMarkdown(file) {
    try {
      const response = await fetch(`pages/${file}`);
      if (!response.ok) {
        throw new Error("게시글을 불러올 수 없습니다.");
      }
      return await response.text();
    } catch (error) {
      console.error("마크다운 로딩 오류:", error);
      throw error;
    }
  }

  // Front Matter 파싱
  function parseFrontMatter(content) {
    const frontMatterMatch = content.match(
      /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
    );

    if (!frontMatterMatch) {
      return {
        metadata: {},
        content: content,
      };
    }

    const frontMatter = frontMatterMatch[1];
    const postContent = frontMatterMatch[2];
    const metadata = {};

    const lines = frontMatter.split(/\r?\n/);
    lines.forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // 따옴표 제거
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // 배열 파싱 (tags)
        if (key === "tags" && value.startsWith("[") && value.endsWith("]")) {
          try {
            value = JSON.parse(value);
          } catch {
            value = value
              .slice(1, -1)
              .split(",")
              .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""));
          }
        }

        metadata[key] = value;
      }
    });

    return {
      metadata: metadata,
      content: postContent,
    };
  }

  // 마크다운을 HTML로 변환
  function markdownToHtml(markdown) {
    if (typeof marked !== "undefined") {
      marked.setOptions({
        breaks: true,
        gfm: true,
      });
      return marked.parse(markdown);
    }
    return markdown;
  }

  // 코드 하이라이팅 적용
  function highlightCode() {
    if (typeof Prism !== "undefined") {
      Prism.highlightAll();
    }
  }

  // 게시글 렌더링
  function renderPost(metadata, htmlContent) {
    const titleHeader = document.getElementById("post-title-header");
    const titleTag = document.getElementById("post-title");
    const dateElement = document.getElementById("post-date");
    const tagsElement = document.getElementById("post-tags");
    const bodyElement = document.getElementById("post-body");

    const title = metadata.title || "제목 없음";
    const date = metadata.date || "";
    const tags = Array.isArray(metadata.tags) ? metadata.tags : [];

    if (titleHeader) titleHeader.textContent = title;
    if (titleTag) titleTag.textContent = title;
    if (dateElement) dateElement.textContent = date;

    if (tagsElement && tags.length > 0) {
      tagsElement.innerHTML = tags
        .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join("");
    }

    if (bodyElement) {
      bodyElement.innerHTML = htmlContent;
    }

    // 코드 하이라이팅 적용
    setTimeout(highlightCode, 100);
  }

  // Giscus 로드
  function loadGiscus() {
    const container = document.getElementById("giscus-container");
    if (!container) return;

    // 기존 스크립트 제거
    const existingScript = document.querySelector('script[src*="giscus"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "tabyjang/tabyjang.github.io");
    script.setAttribute("data-repo-id", "R_kgDOQec2Bw"); // 실제 값으로 교체 필요
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOQec2B84CzIyC"); // 실제 값으로 교체 필요
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "1");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "ko");
    script.crossOrigin = "anonymous";
    script.async = true;

    container.appendChild(script);
  }

  // HTML 이스케이프
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 메인 로딩 함수
  async function loadPost() {
    const file = getPostFile();
    if (!file) {
      document.getElementById("post-body").innerHTML =
        "<p>게시글을 찾을 수 없습니다.</p>";
      return;
    }

    try {
      const markdown = await loadMarkdown(file);

      // UTF-8 BOM 제거
      const content =
        markdown.charCodeAt(0) === 0xfeff ? markdown.slice(1) : markdown;

      const { metadata, content: postContent } = parseFrontMatter(content);
      const htmlContent = markdownToHtml(postContent);

      renderPost(metadata, htmlContent);
      loadGiscus();
    } catch (error) {
      document.getElementById("post-body").innerHTML =
        "<p>게시글을 불러오는 중 오류가 발생했습니다.</p>";
      console.error("게시글 로딩 오류:", error);
    }
  }

  // 초기화
  if (document.getElementById("post-body")) {
    loadPost();
  }
})();

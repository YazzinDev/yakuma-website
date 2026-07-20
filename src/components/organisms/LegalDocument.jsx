import { siteUrl } from '../../config/site.js';
import { supportedLanguages } from '../../i18n/languages.js';
import { parseLegalMarkdown } from '../../legal/markdown.js';

const inlinePattern =
  /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((?:https?:\/\/|mailto:|\/)[^)]+\)|https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/gi;
const siteOrigin = new URL(siteUrl).origin;

function normalizeInternalPath(pathname, language) {
  if (pathname === '/') return `/${language}`;
  if (supportedLanguages.some((supportedLanguage) => pathname === `/${supportedLanguage}` || pathname.startsWith(`/${supportedLanguage}/`))) {
    return pathname;
  }
  return pathname;
}

function normalizeSameSiteHref(href, language) {
  if (href.startsWith('mailto:')) return href;
  if (href.startsWith('/')) return normalizeInternalPath(href, language);

  try {
    const url = new URL(href);
    if (url.origin === siteOrigin) {
      return `${normalizeInternalPath(url.pathname, language)}${url.search}${url.hash}`;
    }
  } catch {
    return href;
  }

  return href;
}

function renderLink(href, children, key, language) {
  const normalizedHref = normalizeSameSiteHref(href, language);

  if (normalizedHref.startsWith('mailto:')) {
    return (
      <a href={normalizedHref} key={key}>
        {children}
      </a>
    );
  }

  if (normalizedHref.startsWith('/')) {
    return (
      <a href={normalizedHref} key={key}>
        {children}
      </a>
    );
  }

  return (
    <a href={normalizedHref} key={key} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

function renderInlineToken(token, key, language) {
  const markdownLink = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
  const inlineCode = /^`(.+)`$/.exec(token);
  const bold = /^\*\*(.+)\*\*$/.exec(token);
  const emphasis = /^\*(.+)\*$/.exec(token);

  if (markdownLink) {
    return renderLink(markdownLink[2], renderInline(markdownLink[1], language), key, language);
  }

  if (inlineCode) {
    return <code key={key}>{inlineCode[1]}</code>;
  }

  if (bold) {
    return <strong key={key}>{renderInline(bold[1], language)}</strong>;
  }

  if (emphasis) {
    return <em key={key}>{renderInline(emphasis[1], language)}</em>;
  }

  if (/^https?:\/\//i.test(token)) {
    return renderLink(token, token, key, language);
  }

  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(token)) {
    return renderLink(`mailto:${token}`, token, key, language);
  }

  return token;
}

function renderInline(text, language) {
  const nodes = [];
  let cursor = 0;

  text.replace(inlinePattern, (token, _match, offset) => {
    if (offset > cursor) {
      nodes.push(text.slice(cursor, offset));
    }
    nodes.push(renderInlineToken(token, `${token}-${offset}`, language));
    cursor = offset + token.length;
    return token;
  });

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function Paragraph({ language, lines }) {
  return (
    <p>
      {lines.map((line, index) => (
        <span key={`${line.text}-${index}`}>
          {index > 0 && lines[index - 1].hardBreak ? <br /> : index > 0 ? ' ' : null}
          {renderInline(line.text, language)}
        </span>
      ))}
    </p>
  );
}

export default function LegalDocument({ language, markdown }) {
  const blocks = parseLegalMarkdown(markdown);

  return (
    <article className="legal-document">
      {blocks.map((block, index) => {
        if (block.type === 'h1') return <h1 key={index}>{block.text}</h1>;
        if (block.type === 'h2') return <h2 key={index}>{block.text}</h2>;
        if (block.type === 'h3') return <h3 key={index}>{block.text}</h3>;
        if (block.type === 'h4') return <h4 key={index}>{block.text}</h4>;
        if (block.type === 'separator') return <hr key={index} />;
        if (block.type === 'table') {
          return (
            <div className="legal-document__table-wrapper" key={index}>
              <table>
                <thead>
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th key={`${header}-${headerIndex}`} scope="col">
                        {renderInline(header, language)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${row.join('|')}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${cell}-${cellIndex}`}>{renderInline(cell, language)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === 'blockquote') {
          return (
            <blockquote key={index}>
              <Paragraph language={language} lines={block.lines} />
            </blockquote>
          );
        }
        if (block.type === 'ordered-list') {
          return (
            <ol key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item, language)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item, language)}</li>
              ))}
            </ul>
          );
        }
        return <Paragraph key={index} language={language} lines={block.lines} />;
      })}
    </article>
  );
}

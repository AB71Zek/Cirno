import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom styling for code blocks
          code({ node, inline, className, children, ...props }:any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <pre className="!bg-neutral-500 text-white p-3 rounded mb-3">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="!bg-neutral-500 text-white px-2 py-1 rounded"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Custom styling for blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-start border-4 border-secondary ps-3 py-2 my-3 bg-light">
                {children}
              </blockquote>
            );
          },
          // Custom styling for tables
          table({ children }) {
            return (
              <div className="table-responsive">
                <table className="table table-striped table-bordered">
                  {children}
                </table>
              </div>
            );
          },
          // Custom styling for links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-decoration-none"
              >
                {children}
              </a>
            );
          },
          // Custom styling for lists
          ul({ children }) {
            return <ul className="ps-4">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="ps-4">{children}</ol>;
          },
          // Custom styling for headings
          h1({ children }) {
            return <h1 className="h3 mb-3">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="h4 mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="h5 mb-2">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="h6 mb-2">{children}</h4>;
          },
          h5({ children }) {
            return <h5 className="h6 mb-2">{children}</h5>;
          },
          h6({ children }) {
            return <h6 className="h6 mb-2">{children}</h6>;
          },
          // Custom styling for paragraphs
          p({ children }) {
            return <p className="mb-2">{children}</p>;
          },
          // Custom styling for horizontal rules
          hr() {
            return <hr className="my-4" />;
          },
          // Custom styling for strong/bold text
          strong({ children }) {
            return <strong className="fw-bold">{children}</strong>;
          },
          // Custom styling for emphasis/italic text
          em({ children }) {
            return <em className="fst-italic">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

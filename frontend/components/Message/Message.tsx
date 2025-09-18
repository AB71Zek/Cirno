import { Card, CardBody } from "react-bootstrap";

interface MessageProps {
  submittedMessage?: string;
  response?: string;
  loading?: boolean;
  role: "user" | "assistant";
  image?: string;
  key: number;
}

const Message: React.FC<MessageProps> = ({
  submittedMessage,
  response,
  loading,
  role,
  image,
}) => {
  const isUser = role === "user";
  const messageText = isUser ? submittedMessage : response;

  return (
    <div
      className={`d-flex mb-3 ${
        isUser ? "justify-content-end" : "justify-content-start"
      }`}
    >
      <Card
        className={`max-w-[70%] ${
          isUser
            ? "text-white bg-primary rounded-end rounded-start-3"
            : "text-dark bg-light rounded-start rounded-end-3"
        }`}
      >
        <CardBody className="px-4 py-2">
          {/* Display image if present */}
          {image && (
            <div className="mb-2">
              <img
                src={image}
                alt="Uploaded content"
                style={{ 
                  maxHeight: '300px', 
                  maxWidth: '100%', 
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
                className="d-block"
              />
            </div>
          )}
          
          {/* Display text message */}
          {messageText && (
            <div>
              {loading && !isUser ? "Typing..." : messageText}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default Message;

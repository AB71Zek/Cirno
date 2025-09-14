import { Button, Container, Form, InputGroup } from "react-bootstrap";

type PromptInputProps = {
  sendMessage: () => Promise<void>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
};

const PromptInput: React.FC<PromptInputProps> = ({
  sendMessage,
  message,
  setMessage,
  loading,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <InputGroup className="mb-4">
          {/* <Button variant="outline-secondary" id="input-button">
            Upload
          </Button> */}
          <Form.Control
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            aria-label="input-prompt"
            aria-describedby="input-button"
          />
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="outline-secondary"
            id="input-button"
          >
            {loading ? "..." : "Send"}
          </Button>
        </InputGroup>
      </Form>
    </Container>
  );
};

export default PromptInput;

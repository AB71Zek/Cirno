import { Button, Container, Form, InputGroup } from "react-bootstrap";

const PromptInput = () => {
  return (
    <Container>
      <InputGroup className="my-10">
        <Button variant="outline-secondary" id="input-button">
          Upload
        </Button>
        <Form.Control
          placeholder="Type your message here..."
          aria-label="input-prompt"
          aria-describedby="input-button"
        />
        <Button variant="outline-secondary" id="input-button">
          Send
        </Button>
      </InputGroup>
    </Container>
  );
};

export default PromptInput;

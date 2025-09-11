import { Card, CardHeader, CardBody, CardText } from "react-bootstrap";

const Message = () => {
  return (
    <Card>
      <CardHeader># I need help with fractions</CardHeader>
      <CardBody>
        <CardText>Okay! Let’s start simple. What is 1/2 + 1/4?</CardText>
      </CardBody>
    </Card>
  );
};

export default Message;

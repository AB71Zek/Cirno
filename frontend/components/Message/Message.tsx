import { Fragment } from "react";
import { Card, CardHeader, CardBody, CardText } from "react-bootstrap";

interface MessageProps {
  submittedMessage: string;
  response: string;
  loading: boolean;
}

const Message: React.FC<MessageProps> = ({
  submittedMessage,
  response,
  loading,
}) => {
  return (
    <Fragment>
      <Card>
        <CardHeader>{submittedMessage}</CardHeader>
        <CardBody>
          <CardText>{loading ? "Loading..." : response}</CardText>
        </CardBody>
      </Card>
      {/* <Button>Give Hint</Button>
      <Button>Give Full Solution</Button> */}
    </Fragment>
  );
};

export default Message;

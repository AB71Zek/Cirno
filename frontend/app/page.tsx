import { Container } from "react-bootstrap";
import Header from "@/components/Header";
import PromptInput from "@/components/common/PromptInput";
// import Message from "@/components/Message";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 items-center justify-center w-full">
        <Container>
          <div className="text-center">
            <h1 className="font-[800]">Cirno Here ᗜˬᗜ</h1>
            <p className="text-lg">What do you need help with?</p>
          </div>
          {/* <Message /> */}
        </Container>
      </div>
      <PromptInput />
    </div>
  );
}

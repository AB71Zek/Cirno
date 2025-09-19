import { Button, Container, Form, InputGroup } from "react-bootstrap";
import { useRef } from "react";

type PromptInputProps = {
  sendMessage: () => Promise<void>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  selectedImage: File | null;
  setSelectedImage: React.Dispatch<React.SetStateAction<File | null>>;
};

const PromptInput: React.FC<PromptInputProps> = ({
  sendMessage,
  message,
  setMessage,
  loading,
  selectedImage,
  setSelectedImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/bmp",
        "image/tiff",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, WebP, BMP, TIFF)");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setSelectedImage(file);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-3 p-3 rounded bg-neutral-700">
            <div className="d-flex justify-content-between align-items-center mb-2 text-white">
              <small className="text-muted !text-white">Selected Image:</small>
              <Button variant="danger" size="sm" onClick={handleImageRemove}>
                Remove
              </Button>
            </div>
            <div className="text-center">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Preview"
                style={{
                  maxHeight: "200px",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                className="rounded"
              />
              <div className="mt-2">
                <small className="text-muted !text-white">
                  {selectedImage.name} (
                  {(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                </small>
              </div>
            </div>
          </div>
        )}

        <InputGroup className="mb-4">
          <Button
            variant="light"
            onClick={handleUploadClick}
            disabled={loading}
            type="button"
          >
            📷 Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/tiff"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          <Form.Control
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            aria-label="input-prompt"
            aria-describedby="input-button"
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || (!message.trim() && !selectedImage)}
            variant="light"
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

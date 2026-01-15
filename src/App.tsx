import { useMemo, useRef, useState, useEffect } from "react";
import Modal from "./components/Modal";
import "./App.css";
import "./index.css";

type Step = "ask" | "download" | "meme";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function titleCaseName(raw: string) {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function App() {
  const [step, setStep] = useState<Step>("ask");
  const [nameInput, setNameInput] = useState("");
  const [friendName, setFriendName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const displayName = useMemo(() => titleCaseName(friendName), [friendName]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app is already installed (use setTimeout to avoid sync setState)
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    if (mediaQuery.matches) {
      setTimeout(() => setIsInstallable(false), 0);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      // Fallback: show instructions or just proceed to meme
      setStep("meme");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      setStep("meme");
    } catch (error) {
      console.error("Error during installation:", error);
      setStep("meme");
    }
  }

  function onStart() {
    const cleaned = titleCaseName(nameInput);
    if (!cleaned) {
      setError("Tell me your friend’s name first 🙂");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setFriendName(cleaned);
    setStep("download");
  }

  function reset() {
    setStep("ask");
    setNameInput("");
    setFriendName("");
    setError(null);
    // focus after render
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="page">
      <div className="card">
        <header className="header">
          <h1 className="title">Testing App</h1>
          {displayName && (
            <p className="subtitle">
              {displayName
                ? `Yahi padh le ${displayName} haath jodh rha hu.`
                : "Yahi padh le yaar haath jodh rha hu."}
            </p>
          )}
        </header>

        {step === "ask" && (
          <div className="stack">
            <label className="label" htmlFor="friendName">
              Friend’s name
            </label>
            <input
              ref={inputRef}
              id="friendName"
              className="input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Rahul"
              autoComplete="off"
              inputMode="text"
              onKeyDown={(e) => {
                if (e.key === "Enter") onStart();
              }}
            />
            {error && <p className="error">{error}</p>}

            <div className="row">
              <button className="btn primary" onClick={onStart}>
                Continue
              </button>
              {/* <button
                className="btn"
                onClick={() => {
                  setNameInput("Bestie");
                  setError(null);
                  setTimeout(() => onStart(), 0);
                }}
              >
                Use a random name
              </button> */}
            </div>

            <p className="fineprint">
              Tip: rotate the phone toward your friend for maximum impact.
            </p>
          </div>
        )}

        {step === "meme" && (
          <div className="stack">
            <div className="memeWrap">
              <img className="meme" src="/image.webp" alt="Prank meme" />
              <div className="memeOverlay">
                <div className="memeTop">
                  Mere Dost {displayName || "YOUR FRIEND"}
                </div>
                <div className="memeBottom">
                  Padh Le Yaar Haath Jodh rha hu App
                </div>
              </div>
            </div>

            <p className="subtitle">
              {displayName ? (
                <>
                  Congrats. <b>{displayName}</b> just got pranked.
                </>
              ) : (
                <>Congrats. Your friend just got pranked.</>
              )}
            </p>

            <div className="row">
              <button className="btn primary" onClick={reset}>
                Prank another friend
              </button>
              <a
                className="btn link"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                Share (coming soon)
              </a>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={step === "download"}
        title="One more step…"
        onClose={() => setStep("meme")}
      >
        <p className="modalText">
          Hey <b>{displayName || "there"}</b> — to continue, please download
          this app.
        </p>
        <div className="modalGrid">
          <button className="btn primary" onClick={handleInstall}>
            {isInstallable ? "Install App" : "Download now"}
          </button>
          <button className="btn" onClick={() => setStep("meme")}>
            I already did
          </button>
          <button className="btn danger" onClick={() => setStep("meme")}>
            No thanks (continue anyway)
          </button>
        </div>
        <p className="fineprint">
          (This is the prank. There is nothing to download.)
        </p>
      </Modal>
    </div>
  );
}

export default App;

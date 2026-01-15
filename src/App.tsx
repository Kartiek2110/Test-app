import { useMemo, useRef, useState, useEffect } from "react";
import Modal from "./components/Modal";
import "./App.css";
import "./index.css";

type Step = "ask" | "download" | "installing" | "meme" | "prank2";

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
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const displayName = useMemo(() => titleCaseName(friendName), [friendName]);

  // Check if app is already installed
  useEffect(() => {
    const checkIfInstalled = () => {
      // Check for standalone mode (PWA installed)
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      // Also check for iOS standalone mode
      const nav = window.navigator as Navigator & { standalone?: boolean };
      const isIOSStandalone = nav.standalone === true;
      // Check if running as installed app
      const isInstalledApp = isStandalone || isIOSStandalone;

      setIsInstalled(isInstalledApp);
      return isInstalledApp;
    };

    // Check immediately
    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      // Only show meme if we're installing or on download step
      // AND the app is now installed (running in standalone mode)
      setTimeout(() => {
        setStep((currentStep) => {
          if (currentStep === "installing" || currentStep === "download") {
            // Double check we're actually in installed app
            const isStandalone = window.matchMedia(
              "(display-mode: standalone)"
            ).matches;
            const nav = window.navigator as Navigator & {
              standalone?: boolean;
            };
            const isIOSStandalone = nav.standalone === true;
            if (isStandalone || isIOSStandalone) {
              return "meme";
            }
          }
          return currentStep;
        });
      }, 500);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      // If no prompt available, check if already installed
      if (isInstalled) {
        setStep("meme");
      }
      return;
    }

    try {
      // Show installing state
      setStep("installing");

      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        // Wait for appinstalled event to fire - don't show meme yet
        // The appinstalled event handler will show the meme
      } else {
        console.log("User dismissed the install prompt");
        // Go back to download step if dismissed
        setStep("download");
        return;
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("Error during installation:", error);
      setStep("download");
    }
  }

  function onStart() {
    const cleaned = titleCaseName(nameInput);
    if (!cleaned) {
      setError("Tell me your friend's name first 🙂");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setFriendName(cleaned);

    // Check if app is already installed - if yes, go straight to meme
    // Double check installation status
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isIOSStandalone = nav.standalone === true;
    const currentlyInstalled = isStandalone || isIOSStandalone;

    if (currentlyInstalled) {
      setIsInstalled(true);
      setStep("meme");
    } else {
      // If not installed, show download modal
      setStep("download");
    }
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

        {step === "installing" && (
          <div className="stack">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
              <h2 style={{ marginBottom: "1rem" }}>Installing App...</h2>
              <p className="subtitle">
                Please wait while we install the app. The prank will appear once
                installation is complete!
              </p>
            </div>
          </div>
        )}

        {step === "meme" && isInstalled && (
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
              <button className="btn primary" onClick={() => setStep("prank2")}>
                Need Placement Advice?
              </button>
            </div>
          </div>
        )}

        {step === "prank2" && (
          <div className="stack">
            <div className="memeWrap">
              <img className="meme" src="/image2.jpg" alt="Second prank" />
              <div className="memeOverlay">
                <div className="memeTop">
                  {displayName ? (
                    <>
                      <b>{displayName}</b>, Abe ja 😂
                    </>
                  ) : (
                    <>Abe Abhi padh le haath jodh rha hu App 😂</>
                  )}
                </div>
              </div>
              <div className="memeBottom">Hum pai toh hain hi Noo</div>
            </div>

            <p className="subtitle" style={{ marginBottom: "2rem" }}>
              This was all a prank! Hope you had fun! 🎭
            </p>

            <div className="row">
              <button className="btn primary" onClick={reset}>
                Prank another friend
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={step === "download"}
        title="One more step…"
        onClose={() => {}}
      >
        <p className="modalText">
          Hey <b>{displayName || "there"}</b> — to continue, please install this
          app.
        </p>
        <div className="modalGrid">
          {isInstallable ? (
            <button className="btn primary" onClick={handleInstall}>
              Install App
            </button>
          ) : (
            <div>
              <p className="modalText" style={{ marginBottom: "1rem" }}>
                Installation prompt will appear when you click the button below.
              </p>
              <button className="btn primary" onClick={handleInstall}>
                Install App
              </button>
            </div>
          )}
        </div>
        <p className="fineprint">
          Please install the app to continue. The meme will appear after
          installation.
        </p>
      </Modal>
    </div>
  );
}

export default App;

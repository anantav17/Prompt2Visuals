# Prompt2Visuals

Prompt2Visuals is a single‑page web application that transforms your text
prompts into beautiful imagery. It combines royalty‑free photos from
Freepik with state‑of‑the‑art generative AI (OpenAI’s GPT Image 1) to give
you eight unique results per prompt. You can select the images you like,
crop or resize them to common aspect ratios (1:1, 9:16 or 16:9) and
download them as JPG or PNG files. All of the heavy lifting happens
server‑side via serverless API routes so your API keys remain hidden.

## Features

* **Freepik search** – Find high quality stock photos matching your prompt.
* **AI generation** – Generate images using OpenAI’s latest image model
  (`gpt-image-1`), following the official images API【102521471217706†screenshot】.
* **Selection & cropping** – Pick the images you like, choose an aspect
  ratio and adjust the crop interactively.
* **Download** – Export your creations as JPG or PNG at the desired
  resolution. Image processing is handled via a serverless `sharp`
  transformation endpoint.
* **Attribution** – Clearly see the licence information and authors for
  Freepik assets.

## Getting started locally

1. **Clone the repository.** If you haven’t already, create a GitHub
   repository and push this code to it. You can use GitHub’s web
   interface – there’s no need to install git on your machine.
2. **Set up environment variables.** Duplicate the `.env.example` file
   and name it `.env.local`. Paste your own API keys:

   ```ini
   FREEPIK_API_KEY=your-freepik-key
   OPENAI_API_KEY=your-openai-key
   LICENSE_FILTER=free        # or all
   SAFE_SEARCH=true           # true or false
   MAX_RESULTS_PER_SOURCE=4
   ```
3. **Install dependencies and run the dev server (optional).**
   If you are comfortable running code locally, install Node.js v18+ and
   run:

   ```bash
   npm install
   npm run dev
   ```

   Then open http://localhost:3000 in your browser. This step is not
   necessary if you plan to deploy directly to Vercel.

## One‑click deployment on Vercel

1. **Import the repository into Vercel.** Go to [Vercel](https://vercel.com)
   and click *New Project*. Select the GitHub repository containing
   Prompt2Visuals.
2. **Add environment variables.** When prompted, create the following
   environment variables (use the names exactly as shown):

   | Variable name             | Value                                      |
   |---------------------------|--------------------------------------------|
   | `FREEPIK_API_KEY`        | Your Freepik API key                        |
   | `OPENAI_API_KEY`         | Your OpenAI API key                         |
   | `LICENSE_FILTER`         | `free` or `all` (default: `free`)           |
   | `SAFE_SEARCH`            | `true` or `false` (default: `true`)         |
   | `MAX_RESULTS_PER_SOURCE` | Number of results per source (default: `4`) |

   You can leave any of these variables unset to fall back to their defaults.
3. **Deploy.** Accept the defaults and click *Deploy*. Within a minute or
   two your application will be live at a `vercel.app` subdomain. Vercel
   automatically provisions serverless functions for the API routes.

## Using the application

1. **Open the site** and type a descriptive prompt into the text area.
2. **Generate** to fetch four Freepik photos and four AI images. Use the
   *Advanced options* to toggle safe search or switch the licence filter.
3. **Select images** you like by clicking on them. Selected cards are
   highlighted and appear in the drawer at the bottom of the page.
4. **Adjust crop & aspect**. Use the cropper to choose the framing you
   prefer and pick between 1:1, 9:16 or 16:9 aspect ratios. Choose
   *Cover* to fill the frame or *Fit* to include the entire image.
5. **Download** your images as JPG or PNG. Each file is prepared on the
   server using the transform endpoint powered by sharp.

## Notes

* **API usage costs.** Image generation via OpenAI and certain Freepik
  downloads may incur costs. Keep your `MAX_RESULTS_PER_SOURCE` value
  conservative to avoid unexpected charges.
* **Licensing.** When using Freepik assets you must respect their
  licence terms. The licence type is displayed on each card.
* **Privacy.** No personal data is stored by this app. API keys are kept
  server‑side and never exposed to the client.

Enjoy turning your prompts into visuals!

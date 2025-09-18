import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import 'dotenv/config';

const elevenlabs = new ElevenLabsClient({
  apiKey: 'sk_df07aa98bec6d9f2528b1af9f676172338a1c29ba9503409',
});
const audio = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
  text: 'The first move is what sets everything in motion.',
  modelId: 'eleven_multilingual_v2',
  outputFormat: 'mp3_44100_128',
});

await play(audio);

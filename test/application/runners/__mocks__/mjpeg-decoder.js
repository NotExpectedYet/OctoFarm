const decoderModule = jest.createMockFromModule("mjpeg-decoder");

let arrayBuffer;

decoderModule.setBuffer = (buffer) => (arrayBuffer = buffer);

decoderModule.decoderForSnapshot = (url) => {
  return {
    takeSnapshot: () => arrayBuffer
  };
};

module.exports = decoderModule;

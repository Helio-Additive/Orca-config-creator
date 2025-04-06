export default function BackgroundPlate() {
  return (
    <>
      <img
        className="absolute w-[2048px] min-w-[1024px] -z-9 opacity-60"
        src="/images/abstract-element.png"
      />
      <img
        className="absolute w-[256px] right-5 top-5 -z-9"
        src="/images/helio-logo.png"
      />
      <div className="bg-background absolute -z-10 w-full h-full"></div>
    </>
  );
}

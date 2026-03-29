import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import ProblemSolution from "@/components/landing/ProblemSolution";
import Steps from "@/components/landing/Steps";
import FadeIn from "@/components/animation/FadeIn";

export default function HomePage() {
  return (
    <div className="bg-[#faf8ff]">
      <Navbar />
      <Hero />
      <FadeIn>
        <ProblemSolution />
      </FadeIn>
      <FadeIn>
        <Features />
      </FadeIn>
      <Steps />
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

const Cta = ({ className }: { className?: string }) => {
    return (
        <section className={`cta-section${className ? ' ' + className : ''}`}>
            <div className="cta-badge">Start learning your way.</div>
            <h2 className="text-3xl font-bold">
                Build and Personalize Learning Companion
            </h2>
            <p>Pick a name, subject, voice, & personality — and start learning through voice conversations that feel natural and fun.</p>
            <button className="cta-btn">
                <Image src="/icons/plus.svg" alt="plus" width={14} height={14}/>
                <Link href="/companions/new">
                    <p>Build a New Companion</p>
                </Link>
            </button>
            <Image src="images/cta.svg" alt="cta" width={362} height={232} />
        </section>
    )
}
export default Cta

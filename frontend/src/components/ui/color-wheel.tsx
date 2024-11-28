import type React from 'react'

const ColorWheel: React.FC = () => {
	return (
		<svg viewBox="0 0 100 100" role="presentation">
			<foreignObject className="logoBack" x="0" y="0" width="100" height="100">
				<div className="logoGradient" />
			</foreignObject>

			<g className="logoBlend">
				<rect x="0" y="0" width="100" height="100" />
				<path d="M 50 96 a 46 46 0 0 1 0 -92 46 46 0 0 1 0 92" />
			</g>
		</svg>
	)
}
export default ColorWheel

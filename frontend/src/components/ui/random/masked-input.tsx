import { IMaskMixin } from 'react-imask'

export const MaskedInput = IMaskMixin(({ inputRef, ...props }) => (
	<input ref={inputRef as any} {...props} />
))

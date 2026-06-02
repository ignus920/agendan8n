import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-800">
                    Información del Perfil
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                    Actualiza la información de tu perfil y la dirección de correo electrónico de tu cuenta.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Nombre" className="text-slate-700 dark:text-slate-700" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full bg-white dark:bg-white border-slate-300 dark:border-slate-300 text-slate-900 dark:text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Correo Electrónico" className="text-slate-700 dark:text-slate-700" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full bg-white dark:bg-white border-slate-300 dark:border-slate-300 text-slate-900 dark:text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-slate-800">
                            Tu dirección de correo electrónico no está verificada.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-slate-600 underline hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Haz clic aquí para volver a enviar el correo de verificación.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                Se ha enviado un nuevo enlace de verificación a tu dirección de correo electrónico.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 font-semibold">Guardar</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-slate-500 font-semibold">
                            Guardado.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

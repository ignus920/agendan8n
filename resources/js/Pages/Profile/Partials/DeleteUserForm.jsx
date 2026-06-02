import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-800">
                    Eliminar Cuenta
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                    Una vez eliminada tu cuenta, todos sus recursos y datos se borrarán permanentemente. Antes de proceder, descarga cualquier información que desees conservar.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 font-semibold">
                Eliminar Cuenta
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6 bg-white border border-slate-200 rounded-2xl">
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-800">
                        ¿Estás seguro de que deseas eliminar tu cuenta?
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                        Una vez que tu cuenta sea eliminada, todos sus recursos y datos se borrarán permanentemente. Por favor, introduce tu contraseña para confirmar que deseas eliminarla de forma permanente.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Contraseña"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4 bg-white dark:bg-white border-slate-300 dark:border-slate-300 text-slate-900 dark:text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                            isFocused
                            placeholder="Contraseña"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal} className="border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2 text-slate-700">
                            Cancelar
                        </SecondaryButton>

                        <DangerButton className="ms-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 font-semibold" disabled={processing}>
                            Eliminar Cuenta
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}

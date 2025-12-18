import InputError from '@/Components/common/ui/InputError';
import InputLabel from '@/Components/common/ui/InputLabel';
import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { CheckCircle } from 'lucide-react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
      <GuestLayout>
        <Head title="Confirm Password" />

        <div className="mb-4 text-sm text-gray-600">
          This is a secure area of the application. Please confirm your password
          before continuing.
        </div>

        <form onSubmit={submit}>
          <div className="mt-4">
            <InputLabel htmlFor="password" value="Password" />

            <Input
              id="password"
              type="password"
              name="password"
              label="Password"
              value={data.password}
              className="mt-1 block w-full"
              placeholder="Enter your password"
              onChange={(e) => setData("password", e.target.value)}
            />

            <InputError message={errors.password} className="mt-2" />
          </div>

          <div className="mt-4 flex items-center justify-end">
            <Button
              className="ms-4"
              label="Confirm"
              variant="primary"
              size="lg"
              icon={<CheckCircle />}
              loading={processing}
              type="submit"
              disabled={processing}
              onClick={submit}
            >
              Confirm
            </Button>
          </div>
        </form>
      </GuestLayout>
    );
}

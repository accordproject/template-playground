import {
  Disclosure,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import {
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import DarkModeToggle from "react-dark-mode-toggle";
import "../styles/components/Navbar.css";

const navigation = [
  { name: "Template Playground", href: "#", current: true },
  { name: "Explore", href: "#", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  return (
    <Disclosure as="nav" className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <img
                alt="Accord Project Logo"
                src="https://playground.accordproject.org/logo.png"
                className="logo"
                decoding="async"
                loading="lazy"
              />
            </div>
            <div className="nav-links">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={classNames(
                      item.current ? "nav-link-active" : "nav-link-inactive",
                      "nav-link"
                    )}
                  >
                    {item.name}
                  </a>
                ))}
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-transparent px-3 py-2 text-sm font-normal text-white shadow-sm ring-0 ring-transparent hover:bg-gray-700">
                      Help
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="-mr-1 size-5 text-gray-400"
                      />
                    </MenuButton>
                  </div>

                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    <div className="py-1">
                      <MenuItem>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                        >
                          About
                        </a>
                      </MenuItem>
                      <MenuItem>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                        >
                          Community
                        </a>
                      </MenuItem>
                      <MenuItem>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                        >
                          Issues
                        </a>
                      </MenuItem>
                      <form action="#" method="POST">
                        <MenuItem>
                          <button
                            type="submit"
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                          >
                            Documentations
                          </button>
                        </MenuItem>
                      </form>
                    </div>
                  </MenuItems>
                </Menu>
                <div className="dark-mode-toggle-container">
                  <DarkModeToggle
                    className="dark-mode-toggle"
                    checked={false}
                    size={80}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Disclosure>
  );
}
